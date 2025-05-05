const express = require('express');
const axios = require('axios');
const cors = require('cors');
const session = require('express-session');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());

// Configure CORS for your GitHub Pages origin
const allowedOrigins = [
  'https://simoxdev1173.github.io',
  'http://localhost:3000' // For local development
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Session configuration
app.use(session({
  name: 'cvgen.sid', // Custom session name
  secret: process.env.SESSION_SECRET || require('crypto').randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // HTTPS in production
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Verify environment variables
if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
  console.error('Missing GitHub OAuth credentials in environment variables');
  process.exit(1);
}

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// GitHub OAuth routes
app.post('/auth/github', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_REDIRECT_URI || 'https://simoxdev1173.github.io/cvGen/#/generate'
      },
      {
        headers: { 
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!tokenResponse.data.access_token) {
      throw new Error('No access token received from GitHub');
    }

    const { access_token } = tokenResponse.data;

    // Get user data from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { 
        Authorization: `token ${access_token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    // Store in session
    req.session.githubToken = access_token;
    req.session.githubUser = userResponse.data;

    res.json({ 
      success: true,
      user: userResponse.data
    });
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(500).json({ 
      error: 'GitHub authentication failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Secure data endpoint
app.get('/api/user', (req, res) => {
  if (!req.session.githubToken || !req.session.githubUser) {
    return res.status(401).json({ error: 'Unauthorized - Please login again' });
  }

  res.json({
    user: req.session.githubUser,
    token: req.session.githubToken
  });
});

// Repositories endpoint with pagination support
app.get('/api/repos', async (req, res) => {
  if (!req.session.githubToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { page = 1, per_page = 30 } = req.query;
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: {
        Authorization: `token ${req.session.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      },
      params: {
        sort: 'updated',
        direction: 'desc',
        page,
        per_page
      }
    });

    const sortedRepos = response.data.sort((a, b) => b.stargazers_count - a.stargazers_count);
    res.json({
      repos: sortedRepos,
      pagination: {
        page: parseInt(page),
        per_page: parseInt(per_page),
        total: response.headers.link ? 
          parseInt(response.headers.link.match(/&page=(\d+)>; rel="last"/)?.[1] || '1') : 1
      }
    });
  } catch (error) {
    console.error('Repo fetch error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch repositories',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Logout endpoint
app.post('/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('cvgen.sid');
    res.json({ success: true });
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy blocked this request' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed CORS origins: ${allowedOrigins.join(', ')}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});