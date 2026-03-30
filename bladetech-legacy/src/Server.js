// server.js

const express = require('express');
// If using Node.js v18 or later, fetch is available natively.
// Otherwise, uncomment the following line and ensure node-fetch is installed.
// const fetch = require('node-fetch');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

dotenv.config(); // Load environment variables from .env file

const app = express();

// Retrieve environment variables
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

// Configure CORS options
const corsOptions = {
  origin: FRONTEND_ORIGIN, // e.g., 'http://localhost:3000'
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Use CORS middleware
app.use(cors(corsOptions));

// Use morgan for logging HTTP requests
app.use(morgan('combined'));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Parse incoming JSON requests
app.use(express.json());

// Rate limiting middleware
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply the rate limiting middleware to the login route
app.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    // Attempt to authenticate the user
    const user = await loginUser(email, password); // Ensure loginUser is properly implemented

    if (!user) {
      // If authentication fails, respond with a generic message
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // If authentication is successful, generate a token or establish a session
    // For example, using JWT:
    const token = generateJWT(user); // Implement generateJWT accordingly

    // Respond with the token
    return res.json({ success: true, token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

/**
 * Example implementations of loginUser and generateJWT.
 * Replace these with your actual authentication and token generation logic.
 */

// Dummy loginUser function
async function loginUser(email, password) {
  // Replace with your actual user authentication logic, e.g., database lookup and password verification
  // For demonstration purposes, let's assume any email/password combination is valid
  if (email && password) {
    return { id: 1, email }; // Dummy user object
  }
  return null;
}

// Dummy generateJWT function
function generateJWT(user) {
  const jwt = require('jsonwebtoken');
  const secretKey = process.env.JWT_SECRET || 'your_jwt_secret_key'; // Use environment variable for the secret key

  // Create a token payload
  const payload = {
    id: user.id,
    email: user.email,
  };

  // Sign the token
  return jwt.sign(payload, secretKey, { expiresIn: '1h' });
}
