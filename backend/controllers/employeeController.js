const Employee = require('../models/Employee');
const Department = require('../models/Department');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// GET /api/employees
const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ tenantId: req.user.tenantId })
      .populate('userId', 'name email role')
      .populate('tenantId', 'companyName')
      .populate('department', 'name description');
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
      .populate('tenantId', 'companyName')
      .populate('department', 'name description');

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
    const { name, email, password, role, departmentName, position, salary, joiningDate } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Step 1: Find or create the department (case-insensitive)
    let department = null;
    if (departmentName && departmentName.trim()) {
      department = await Department.findOne({
        name: { $regex: new RegExp(`^${departmentName.trim()}$`, 'i') },
        tenantId: req.user.tenantId,
      });

      if (!department) {
        department = await Department.create({
          name: departmentName.trim(),
          tenantId: req.user.tenantId,
        });
      }
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

    // Step 2: Create Employee with department ObjectId
    const employee = new Employee({
      userId: user._id,
      tenantId: req.user.tenantId,
      department: department ? department._id : undefined,
      position: position || '',
      salary: salary || 0,
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
    });
    await employee.save();

    // Step 3: Return populated employee
    const populated = await Employee.findById(employee._id)
      .populate('userId', 'name email role')
      .populate('tenantId', 'companyName')
      .populate('department', 'name description');

    res.status(201).json(populated);
  } catch (err) {
    console.error('Create employee error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/employees/:id
const updateEmployee = async (req, res) => {
  try {
    const { departmentName, position, salary, joiningDate } = req.body;

    // Find or create department if a name was provided
    let departmentId;
    if (departmentName && departmentName.trim()) {
      let department = await Department.findOne({
        name: { $regex: new RegExp(`^${departmentName.trim()}$`, 'i') },
        tenantId: req.user.tenantId,
      });
      if (!department) {
        department = await Department.create({
          name: departmentName.trim(),
          tenantId: req.user.tenantId,
        });
      }
      departmentId = department._id;
    }

    const updateFields = { position, salary, joiningDate };
    if (departmentId) updateFields.department = departmentId;

    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      updateFields,
      { new: true }
    )
      .populate('userId', 'name email role')
      .populate('tenantId', 'companyName')
      .populate('department', 'name description');

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
