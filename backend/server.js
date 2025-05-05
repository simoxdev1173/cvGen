// backend/server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

// Route GitHub redirects to — just forwards the code to frontend
app.get('/auth/github/callback', (req, res) => {
  const code = req.query.code;
  const redirectUrl = `https://simoxdev1173.github.io/cvGen/#/generate?code=${code}`;
  res.redirect(redirectUrl);
});

// Frontend sends code here to get access token and user info
app.post('/auth/github/send', async (req, res) => {
  const code = req.body.code;

  try {
    const tokenRes = await axios.post(
      `https://github.com/login/oauth/access_token`,
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    const access_token = tokenRes.data.access_token;

    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${access_token}` },
    });

    res.json({
      token: access_token,
      user: userRes.data,
    });
  } catch (error) {
    console.error('GitHub Auth Error:', error.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
