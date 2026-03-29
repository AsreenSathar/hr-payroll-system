const Employee = require('../models/Employee');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// GET /api/employees
const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ tenantId: req.user.tenantId })
      .populate('userId', 'name email role')
      .populate('tenantId', 'companyName');
    res.json(employees);
  } catch (err) {
    console.error('Get employees error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/employees/:id
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId,
    })
      .populate('userId', 'name email role')
      .populate('tenantId', 'companyName');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (err) {
    console.error('Get employee error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/employees
const createEmployee = async (req, res) => {
  try {
    const { name, email, password, role, department, position, salary, joiningDate } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password for the new user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'defaultPassword123', salt);

    // Create User account
    const user = new User({
      tenantId: req.user.tenantId,
      name,
      email,
      password: hashedPassword,
      role: role || 'employee',
    });
    await user.save();

    // Create Employee record
    const employee = new Employee({
      userId: user._id,
      tenantId: req.user.tenantId,
      department: department || '',
      position: position || '',
      salary: salary || 0,
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
    });
    await employee.save();

    const populated = await Employee.findById(employee._id)
      .populate('userId', 'name email role')
      .populate('tenantId', 'companyName');

    res.status(201).json(populated);
  } catch (err) {
    console.error('Create employee error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/employees/:id
const updateEmployee = async (req, res) => {
  try {
    const { department, position, salary, joiningDate } = req.body;

    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { department, position, salary, joiningDate },
      { new: true }
    )
      .populate('userId', 'name email role')
      .populate('tenantId', 'companyName');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (err) {
    console.error('Update employee error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/employees/:id
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.user.tenantId,
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Also delete the associated user
    await User.findByIdAndDelete(employee.userId);

    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    console.error('Delete employee error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee };
