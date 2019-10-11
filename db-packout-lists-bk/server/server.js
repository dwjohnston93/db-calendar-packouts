// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback-workspace
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');
const path = require('path');
const fs = require('fs');
const {google} = require('googleapis');
const url = require('url');
var qs = require('querystring');
var https = require('https');
var fetch = require('node-fetch');
var queryString = require('query-string');


var app = module.exports = loopback();

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

//To use OAuth2 authentication, we need access to a a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI
const keyPath = path.join(__dirname, 'credentials.json');
let keys = {redirect_uris: ['']};
if (fs.existsSync(keyPath)) {
  keys = require(keyPath).web;
}

//Create a new OAuth2 client with the configured keys.
const oAuth2Client = new google.auth.OAuth2(
  keys.client_id,
  keys.client_secret,
  keys.redirect_uris[0],
);


//This scope tells google what information we want to request.
const DEFAULT_SCOPE = [
  'https://www.googleapis.com/auth/calendar.events.readonly'
];

//Get a url which will open the google sign-in page and request access to the scope provided (such as calendar events). 
const connectionUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: DEFAULT_SCOPE
})

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

async function tokenExchange(code){
  const {tokens} = await oAuth2Client.getToken(code)
  oAuth2Client.setCredentials(tokens)
  // Store the token to disk for later program executions
  fs.writeFile(TOKEN_PATH, JSON.stringify(tokens), (err) => {
    if (err) return console.error(err);
  });
}

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // this middleware is invoked in the "routes" phase
  app.get('/authenticate', function(req, res, next) {
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      //if err is thrown, redirect users to the Google auth URL
      if (err) return res.redirect(connectionUrl);
      //otherwise have returnUser's credentials get set from saved token file
      let returnUser = new Promise((resolve, reject) => {
        resolve(oAuth2Client.setCredentials(JSON.parse(token)))
        fetch('https://www.googleapis.com/oauth2/v4/token', {
          method: 'POST',
          headers: {'Content-Type':'application/x-www-form-urlencoded'}, 
          body: queryString.stringify({
            client_id: oAuth2Client._clientId, 
            client_secret: oAuth2Client._clientSecret,
            refresh_token: oAuth2Client.credentials.refresh_token,
            grant_type: "refresh_token"
          })
        })
        .then(res => res.json())
        .then(json => oAuth2Client.setCredentials(json));
    }) 
    returnUser.then(res.redirect('http://localhost:8080'))
  })
})

  app.get('/oauth2', function(req, res, next){
    if (req.url.indexOf('/oauth2') > -1) return getToken()
    async function getToken(){
      const qs = new url.URL(req.url, 'http://localhost:3000').searchParams.get('code');
      let tokenPromise = new Promise((resolve, reject) => {
        tokenExchange(qs);
        resolve(res.redirect('http://localhost:8080'))
      })
      let redirect = await tokenPromise 
    }
  })

  app.post('/event', function(req, res, next){  
    var body = ''
    req.on('data', function (data) {
      body += data;

      // Too much POST data, kill the connection!
      if (body.length > 1e6)
          req.connection.destroy();
    });

    req.on('end', function() {
        var post = qs.parse(body);

        const calendar = google.calendar('v3');
        calendar.events.get({
          auth: oAuth2Client,
          calendarId: "dwjohnston93@gmail.com",
          eventId: post.eventID
        }, (err, res) => {
          if (err) return console.log(`The API returned an error: ${err}`)
          let eventData = res.data;
          console.log("eventData:", eventData)
          fetch('http://localhost:8080/packout/confirm', {
            method: 'POST',
            headers: {'Content-Type':'application/x-www-form-urlencoded'}, // this line is important, if this content-type is not set it wont work
            body: queryString.stringify({
              data: eventData
            })
          })
          // .then(res => {
          //   res.json()
          //   console.log("res:", res)})
          .then(req => req.text())
          .then(text => console.log("****text:****", text))
            .catch(err => {
            console.log("err right here****:", err)
            return ReE(res, err.message, 500)
          })
        })
        res.redirect("http://localhost:8080/packout-confirm")
    });
  })

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});
