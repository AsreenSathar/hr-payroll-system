const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Transaction = require('../models/Transaction');
const Employee = require('../models/Employee');

router.use(authMiddleware);

// GET all transactions for tenant
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find({ tenantId: req.user.tenantId })
      .populate({
        path: 'employeeId',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate('payrollId')
      .populate('tenantId', 'companyName')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET transactions by employee
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.params.employeeId,
      tenantId: req.user.tenantId,
    });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const transactions = await Transaction.find({
      employeeId: req.params.employeeId,
      tenantId: req.user.tenantId,
    })
      .populate({
        path: 'employeeId',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate('payrollId')
      .populate('tenantId', 'companyName')
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    console.error('Get transactions by employee error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET single transaction
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId,
    })
      .populate({
        path: 'employeeId',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate('payrollId')
      .populate('tenantId', 'companyName');
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
