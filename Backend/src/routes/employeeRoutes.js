const express = require('express');
const { createEmployee, getEmployees, updateEmployee, deleteEmployee, disburseCommission } = require('../controllers/employeeController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, createEmployee)
  .get(protect, getEmployees);

router.route('/:id')
  .put(protect, updateEmployee)
  .delete(protect, deleteEmployee);

router.route('/:id/disburse')
  .put(protect, disburseCommission);

module.exports = router;
