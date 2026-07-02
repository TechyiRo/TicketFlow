const { validationResult } = require('express-validator');

/**
 * Middleware to check validation results from express-validator
 */
module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
      message: errors.array()[0].msg, // Return the first error as message for quick display
    });
  }
  next();
};
