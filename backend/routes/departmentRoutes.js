const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Department = require('../models/Department');

router.use(authMiddleware);

// GET all departments for tenant
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find({ tenantId: req.user.tenantId })
      .populate('tenantId', 'companyName')
      .populate({
        path: 'managerId',
        populate: { path: 'userId', select: 'name email' },
      });
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET department by ID
router.get('/:id', async (req, res) => {
  try {
    const dept = await Department.findOne({ _id: req.params.id, tenantId: req.user.tenantId })
      .populate('tenantId', 'companyName')
      .populate({
        path: 'managerId',
        populate: { path: 'userId', select: 'name email' },
      });
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    res.json(dept);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST create department
router.post('/', async (req, res) => {
  try {
    const { name, description, managerId } = req.body;
    const dept = new Department({
      tenantId: req.user.tenantId,
      name,
      description: description || '',
      managerId: managerId || null,
    });
    await dept.save();

    const populated = await Department.findById(dept._id)
      .populate('tenantId', 'companyName')
      .populate({
        path: 'managerId',
        populate: { path: 'userId', select: 'name email' },
      });
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update department
router.put('/:id', async (req, res) => {
  try {
    const { name, description, managerId } = req.body;
    const dept = await Department.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { name, description, managerId },
      { new: true }
    )
      .populate('tenantId', 'companyName')
      .populate({
        path: 'managerId',
        populate: { path: 'userId', select: 'name email' },
      });
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    res.json(dept);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE department
router.delete('/:id', async (req, res) => {
  try {
    const dept = await Department.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.user.tenantId,
    });
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
