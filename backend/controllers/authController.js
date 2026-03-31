const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tenant = require('../models/Tenant');

const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { companyName, domain, plan, name, email, password, role } = req.body;

    // Server-side Gmail validation
    if (!email || !GMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ message: 'Only Gmail addresses are allowed.' });
    }

    // Server-side password length validation (before hashing)
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create Tenant first
    const tenant = new Tenant({
      companyName,
      domain: domain || '',
      plan: plan || 'free',
    });
    await tenant.save();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const user = new User({
      tenantId: tenant._id,
      name,
      email: email.trim(),
      password: hashedPassword,
      role: role || 'admin',
    });
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role, tenantId: tenant._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: tenant._id,
        companyName: tenant.companyName,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Server-side Gmail validation
    if (!email || !GMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ message: 'Only Gmail addresses are allowed.' });
    }

    // Find user
    const user = await User.findOne({ email: email.trim() }).populate('tenantId');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role, tenantId: user.tenantId._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId._id,
        companyName: user.tenantId.companyName,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

module.exports = { register, login };
