const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
    required: true,
  },
  basicPay: {
    type: Number,
    required: true,
    default: 0,
  },
  deductions: {
    type: Number,
    default: 0,
  },
  netPay: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending',
  },
});

module.exports = mongoose.model('Payroll', payrollSchema);
