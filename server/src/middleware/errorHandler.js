/**
 * errorHandler.js — Centralized Error Handler
 *
 * Express error handler must have 4 parameters: (err, req, res, next)
 * This catches all errors thrown via next(error) or throw.
 *
 * Normalizes errors into consistent JSON format:
 * { error: "message", ...(dev: stack trace) }
 */

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message || 'Internal server error';

  // Mongoose duplicate key error (e.g. duplicate email)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join('. ');
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  const response = {
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  console.error(`[${new Date().toISOString()}] ${statusCode} ${req.method} ${req.path} — ${message}`);

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
