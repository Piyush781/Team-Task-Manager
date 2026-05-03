const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map(e => ({ field: e.path, message: e.msg }));
    return res.status(422).json({ errors: formatted });
  }
  next();
};

module.exports = validate;