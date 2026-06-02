const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Collects express-validator results and throws a 400 with field-level
 * messages when any validation rule failed. Place after the validators
 * array in a route definition.
 */
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({
    field: e.path || e.param,
    message: e.msg,
  }));

  throw new ApiError(400, 'Validation failed', errors);
};

module.exports = validate;
