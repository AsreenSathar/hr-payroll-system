const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// GET /api/attendance/:employeeId
const getAttendanceByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Verify the employee belongs to the requesting tenant
    const employee = await Employee.findOne({
      _id: employeeId,
      tenantId: req.user.tenantId,
    });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const attendanceRecords = await Attendance.find({ employeeId })
      .populate({
        path: 'employeeId',
        populate: { path: 'userId', select: 'name email' },
      })
      .sort({ date: -1 });

    res.json(attendanceRecords);
  } catch (err) {
    console.error('Get attendance by employee error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/attendance
const markAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, checkIn, checkOut } = req.body;

    // Server-side future date validation
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (new Date(date) > today) {
      return res
        .status(400)
        .json({ message: 'Cannot mark attendance for a future date.' });
    }

    // Verify the employee belongs to the requesting tenant
    const employee = await Employee.findOne({
      _id: employeeId,
      tenantId: req.user.tenantId,
    });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Upsert: update if exists, create if not
    const existing = await Attendance.findOne({
      employeeId,
      date: new Date(date),
    });

    let attendance;
    if (existing) {
      existing.status = status || existing.status;
      existing.checkIn = checkIn !== undefined ? checkIn : existing.checkIn;
      existing.checkOut = checkOut !== undefined ? checkOut : existing.checkOut;
      attendance = await existing.save();
    } else {
      attendance = await Attendance.create({
        employeeId,
        date: new Date(date),
        status: status || 'present',
        checkIn: checkIn || '',
        checkOut: checkOut || '',
      });
    }

    const populated = await Attendance.findById(attendance._id).populate({
      path: 'employeeId',
      populate: { path: 'userId', select: 'name email' },
    });

    res.status(201).json(populated);
  } catch (err) {
    console.error('Mark attendance error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAttendanceByEmployee, markAttendance };
