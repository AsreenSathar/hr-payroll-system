const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  position: {
    type: String,
    trim: true,
  },
  salary: {
    type: Number,
    default: 0,
  },
  joiningDate: {
    type: Date,
  },
});

module.exports = mongoose.model('Employee', employeeSchema);
