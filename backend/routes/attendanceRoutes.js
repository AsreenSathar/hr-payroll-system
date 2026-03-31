const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getAttendanceByEmployee, markAttendance } = require('../controllers/attendanceController');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// All routes require authentication
router.use(authMiddleware);

// GET /api/attendance — aggregate summary for the dashboard (all tenant employees)
// Must be defined BEFORE /:employeeId so it isn't captured by that pattern
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find({ tenantId: req.user.tenantId }).select('_id');
    const employeeIds = employees.map((e) => e._id);

    const records = await Attendance.find({ employeeId: { $in: employeeIds } })
      .populate({
        path: 'employeeId',
        populate: { path: 'userId', select: 'name email' },
      })
      .sort({ date: -1 });

    res.json(records);
  } catch (err) {
    console.error('Get all attendance error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/attendance/:employeeId — fetch records for one employee only
router.get('/:employeeId', getAttendanceByEmployee);

// POST /api/attendance — mark (or update) attendance for an employee
router.post('/', markAttendance);

module.exports = router;
