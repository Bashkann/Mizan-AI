const { body, validationResult } = require('express-validator');

/**
 * Validation rules for the AI query endpoint
 * - caseDescription: required string, 50-2000 chars, trimmed and escaped
 */
const validateQuery = [
  body('caseDescription')
    .trim()
    .notEmpty()
    .withMessage('Dava açıklaması boş olamaz.')
    .isString()
    .withMessage('Dava açıklaması metin formatında olmalıdır.')
    .isLength({ min: 50 })
    .withMessage('Dava açıklaması en az 50 karakter olmalıdır.')
    .isLength({ max: 2000 })
    .withMessage('Dava açıklaması en fazla 2000 karakter olabilir.')
    .escape(),
];

/**
 * Middleware to check validation results and return errors if any
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      message: 'Geçersiz giriş verisi.',
      errors: formattedErrors,
    });
  }

  next();
};

module.exports = { validateQuery, handleValidationErrors };
