const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const { google } = require("googleapis");
const axios = require("axios");
const dotenv = require('dotenv');
dotenv.config();



const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(bodyParser.json())
app.use(express.json())

const BASE_URL = process.env.BASE_URL;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET
const Front_redirectUrl = process.env.Front_Redirect_URL

const oauthConfig = {
  client_id: GOOGLE_CLIENT_ID,
  project_id: GOOGLE_PROJECT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_secret: GOOGLE_CLIENT_SECRET,
  redirect_uris: `http://localhost:5500/auth/google/callback`,
  JWTsecret: "secret",
  scopes: [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid",
  ],
};
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  oauthConfig.client_id,
  oauthConfig.client_secret,
  oauthConfig.redirect_uris
);
// for generating google Auth Code
app.get("/auth/google", function (req, res) {
  const loginLink = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: oauthConfig.scopes,
  })
  console.log("baseURL: --->... ", BASE_URL);
  res.redirect(loginLink);
});

//google Redirect url 
app.get("/auth/google/callback", function (req, res, errorHandler) {
  if (req.query.error) {
    return errorHandler(req.query.error);
  } else {
    const authCodeFromQueryString = req.query.code;
    oauth2Client.getToken(authCodeFromQueryString, async function (error,token) {
      if (error) return errorHandler(error);
      const vueAppUrl = `${Front_redirectUrl}?gtoken=${token.id_token}`;
      return res.redirect(vueAppUrl, '_blank', 'width=600,height=800');
    });
  }
});

//facebook  auth code generating
app.get('/auth/facebook', (req, res) => {
  const BASE_URL = `http://localhost:5500`;
  const redirect_uri = `${BASE_URL}/auth/facebook/callback`;
  const scope = 'email';
  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${redirect_uri}&scope=${scope}`;
  res.redirect(authUrl);
});

// Facebook OAuth Callback for generate Acesstoken
app.get('/auth/facebook/callback', async (req, res) => {
  const { code } = req.query;
  console.log("code", code);
  const BASE_URL = `http://localhost:5500`;
  const redirect_uri = `${BASE_URL}/auth/facebook/callback`;
  const accessTokenUrl = 'https://graph.facebook.com/v11.0/oauth/access_token';
  const accessTokenParams = {
    client_id: FACEBOOK_APP_ID,
    client_secret: FACEBOOK_APP_SECRET,
    redirect_uri,
    code,
  };
  try {
    const { data } = await axios.get(accessTokenUrl, { params: accessTokenParams });
    const accessToken = data.access_token;
    const profileUrl = 'https://graph.facebook.com/me';
    const profileParams = {
      fields: 'id,name,email',
      access_token: accessToken,
    };
    const { data: profileData } = await axios.get(profileUrl, { params: profileParams });
    console.log("---------------------->.... profileData", profileData);
    const vueAppUrl = `${Front_redirectUrl}?ftoken=${accessToken}`;
    return res.redirect(vueAppUrl, '_blank', 'width=600,height=800');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.post("/logout", (req, res) => {
  res.redirect("http://localhost:5500");
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});