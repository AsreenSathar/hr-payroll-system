const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
});

module.exports = mongoose.model('Department', departmentSchema);
