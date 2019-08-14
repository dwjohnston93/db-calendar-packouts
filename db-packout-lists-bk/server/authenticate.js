const fs = require('fs');
const {google} = require('googleapis');
const path = require('path');

const plus = google.plus('v1');

/**
 * To use OAuth2 authentication, we need access to a a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI.  To get these credentials for your application, visit https://console.cloud.google.com/apis/credentials.
 */
const keyPath = path.join(__dirname, 'credentials.json');
let keys = {redirect_uris: ['']};
console.log(fs.existsSync(keyPath))
if (fs.existsSync(keyPath)) {
  keys = require(keyPath).web;
}

/**
 * Create a new OAuth2 client with the configured keys.
 */
const oAuth2Client = new google.auth.OAuth2(
  keys.client_id,
  keys.client_secret,
  keys.redirect_uris[0],
);

/**
 * This scope tells google what information we want to request.
 */
const DEFAULT_SCOPE = [
  'https://www.googleapis.com/auth/calendar.events.readonly'
];

/**
 * Get a url which will open the google sign-in page and request access to the scope provided (such as calendar events).
 */
const connectionUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: DEFAULT_SCOPE
})

console.log("connectionUrl:", connectionUrl)

module.exports = {
  authUrl: connectionUrl
}
