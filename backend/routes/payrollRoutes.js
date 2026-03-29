const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getPayrolls, generatePayroll, processPayroll, getPayrollByEmployee } = require('../controllers/payrollController');

router.use(authMiddleware);

router.get('/', getPayrolls);
router.get('/employee/:employeeId', getPayrollByEmployee);
router.post('/generate', generatePayroll);
router.post('/process/:payrollId', processPayroll);

module.exports = router;
