const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const CREDS =  require('./credentials.js')

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Calendar API.
    authorize(JSON.parse(content), listEvents);
});

// generate a url that asks permissions for Google Calendar scopes
const SCOPES = ['https://www.googleapis.com/auth/calendar.events.readonly'];

const oauth2Client = new google.auth.OAuth2(
    CREDS.client_id,
    CREDS.client_secret,
    CREDS.redirect_uris
);

const url = oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: 'offline',
  
    // If you only need one scope you can pass it as a string
    scope: scopes
  });