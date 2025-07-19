const { body } = require('express-validator');

const expenseValidation = [
  body('amount').isFloat({ min: 0.01 }),
  body('description').isString().trim().notEmpty(),
  body('paid_by').isString().trim().notEmpty(),
  body('split_type').isIn(['equal', 'percentage', 'exact', 'shares']),
  // Add more validators for split_details if needed
];

module.exports = { expenseValidation };
