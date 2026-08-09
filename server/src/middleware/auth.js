/**
 * auth.js — JWT Authentication Middleware
 *
 * Extracts and verifies the JWT from the Authorization header.
 * Attaches `req.user` (the decoded payload) to the request.
 *
 * Usage: router.get('/protected', auth, controller)
 *
 * Why JWT?
 * - Stateless: no session storage needed
 * - The server validates the token signature using JWT_SECRET
 * - Token payload: { userId, name, email, iat, exp }
 */

const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // { userId, name, email }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

module.exports = auth;
