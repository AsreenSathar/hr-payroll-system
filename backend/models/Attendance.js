const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'leave'],
    default: 'present',
  },
  checkIn: {
    type: String,
  },
  checkOut: {
    type: String,
  },
});

module.exports = mongoose.model('Attendance', attendanceSchema);
