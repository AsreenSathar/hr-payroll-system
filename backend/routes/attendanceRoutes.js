const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

router.use(authMiddleware);

// POST mark attendance
router.post('/', async (req, res) => {
  try {
    const { employeeId, date, status, checkIn, checkOut } = req.body;

    // Verify employee belongs to tenant
    const employee = await Employee.findOne({ _id: employeeId, tenantId: req.user.tenantId });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    // Check if attendance already marked for this date
    const existingAttendance = await Attendance.findOne({
      employeeId,
      date: new Date(date),
    });
    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already marked for this date' });
    }

    const attendance = new Attendance({
      employeeId,
      date: new Date(date),
      status: status || 'present',
      checkIn: checkIn || '',
      checkOut: checkOut || '',
    });
    await attendance.save();

    const populated = await Attendance.findById(attendance._id).populate({
      path: 'employeeId',
      populate: { path: 'userId', select: 'name email' },
    });

    res.status(201).json(populated);
  } catch (err) {
    console.error('Mark attendance error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET attendance by employee
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.params.employeeId,
      tenantId: req.user.tenantId,
    });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const attendanceRecords = await Attendance.find({ employeeId: req.params.employeeId })
      .populate({
        path: 'employeeId',
        populate: { path: 'userId', select: 'name email' },
      })
      .sort({ date: -1 });

    res.json(attendanceRecords);
  } catch (err) {
    console.error('Get attendance error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET all attendance for tenant
router.get('/', async (req, res) => {
  try {
    // Get all employees for this tenant
    const employees = await Employee.find({ tenantId: req.user.tenantId }).select('_id');
    const employeeIds = employees.map((e) => e._id);

    const attendanceRecords = await Attendance.find({ employeeId: { $in: employeeIds } })
      .populate({
        path: 'employeeId',
        populate: { path: 'userId', select: 'name email' },
      })
      .sort({ date: -1 });

    res.json(attendanceRecords);
  } catch (err) {
    console.error('Get all attendance error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update attendance
router.put('/:id', async (req, res) => {
  try {
    const { status, checkIn, checkOut } = req.body;
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { status, checkIn, checkOut },
      { new: true }
    ).populate({
      path: 'employeeId',
      populate: { path: 'userId', select: 'name email' },
    });
    if (!attendance) return res.status(404).json({ message: 'Attendance record not found' });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
