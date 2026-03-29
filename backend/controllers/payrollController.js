const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const Payroll = require('../models/Payroll');
const Transaction = require('../models/Transaction');
const Employee = require('../models/Employee');

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// GET /api/payroll
const getPayrolls = async (req, res) => {
  try {
    const payrolls = await Payroll.find({ tenantId: req.user.tenantId })
      .populate({
        path: 'employeeId',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate('tenantId', 'companyName');
    res.json(payrolls);
  } catch (err) {
    console.error('Get payrolls error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/payroll/generate
const generatePayroll = async (req, res) => {
  try {
    const { employeeId, month, year, basicPay, deductions } = req.body;

    // Verify employee belongs to tenant
    const employee = await Employee.findOne({
      _id: employeeId,
      tenantId: req.user.tenantId,
    });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const netPay = (basicPay || 0) - (deductions || 0);

    const payroll = new Payroll({
      employeeId,
      tenantId: req.user.tenantId,
      month,
      year,
      basicPay: basicPay || 0,
      deductions: deductions || 0,
      netPay,
      status: 'pending',
    });
    await payroll.save();

    const populated = await Payroll.findById(payroll._id)
      .populate({
        path: 'employeeId',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate('tenantId', 'companyName');

    res.status(201).json(populated);
  } catch (err) {
    console.error('Generate payroll error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/payroll/process/:payrollId
const processPayroll = async (req, res) => {
  try {
    // 1. Find payroll and populate
    const payroll = await Payroll.findOne({
      _id: req.params.payrollId,
      tenantId: req.user.tenantId,
    })
      .populate({
        path: 'employeeId',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate('tenantId', 'companyName');

    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }
    if (payroll.status === 'paid') {
      return res.status(400).json({ message: 'Payroll already processed' });
    }

    const employee = payroll.employeeId;
    const tenant = payroll.tenantId;
    const employeeUser = employee.userId;

    const monthName = MONTH_NAMES[payroll.month];
    const transactionId = `TXN-${Date.now()}`;

    // 2. Mark payroll as paid
    payroll.status = 'paid';
    await payroll.save();

    // 3. Generate PDF receipt
    const receiptsDir = path.join(__dirname, '..', 'receipts');
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }
    const pdfFileName = `receipt_${transactionId}.pdf`;
    const pdfFilePath = path.join(receiptsDir, pdfFileName);

    await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(pdfFilePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(22).fillColor('#1a1a2e').font('Helvetica-Bold')
        .text(tenant.companyName, { align: 'center' });
      doc.fontSize(14).fillColor('#4a4a6a').font('Helvetica')
        .text('Salary Receipt', { align: 'center' });
      doc.moveDown();

      // Horizontal line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#cccccc');
      doc.moveDown();

      // Employee Info
      doc.fontSize(12).fillColor('#333333').font('Helvetica-Bold').text('Employee Details');
      doc.font('Helvetica').fillColor('#555555');
      doc.text(`Name: ${employeeUser.name}`);
      doc.text(`Email: ${employeeUser.email}`);
      doc.text(`Position: ${employee.position || 'N/A'}`);
      doc.text(`Department: ${employee.department || 'N/A'}`);
      doc.moveDown();

      // Pay Period
      doc.font('Helvetica-Bold').fillColor('#333333').text('Pay Period');
      doc.font('Helvetica').fillColor('#555555');
      doc.text(`Month: ${monthName} ${payroll.year}`);
      doc.moveDown();

      // Salary Breakdown
      doc.font('Helvetica-Bold').fillColor('#333333').text('Salary Breakdown');
      doc.font('Helvetica').fillColor('#555555');
      doc.text(`Basic Pay:    ₹${payroll.basicPay.toLocaleString()}`);
      doc.text(`Deductions:   ₹${payroll.deductions.toLocaleString()}`);
      doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke('#cccccc');
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fillColor('#1a1a2e')
        .text(`Net Pay:      ₹${payroll.netPay.toLocaleString()}`);
      doc.moveDown();

      // Transaction Info
      doc.font('Helvetica').fillColor('#555555');
      doc.text(`Transaction ID: ${transactionId}`);
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`);
      doc.text(`Status: PAID`);
      doc.moveDown(2);

      // Footer
      doc.fontSize(10).fillColor('#aaaaaa')
        .text('This is a system-generated document.', { align: 'center' });

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    // 4. Create Transaction record
    const transaction = new Transaction({
      payrollId: payroll._id,
      employeeId: employee._id,
      tenantId: tenant._id,
      amount: payroll.netPay,
      status: 'success',
      pdfPath: `/receipts/${pdfFileName}`,
    });
    await transaction.save();

    // 5. Send email with PDF attachment
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"${tenant.companyName} HR" <${process.env.EMAIL_USER}>`,
        to: employeeUser.email,
        subject: `Salary Credited - ${monthName} ${payroll.year}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a2e;">${tenant.companyName}</h2>
            <h3>Salary Credited Successfully!</h3>
            <p>Dear ${employeeUser.name},</p>
            <p>We are pleased to inform you that your salary for <strong>${monthName} ${payroll.year}</strong> has been credited.</p>
            <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
              <tr><td style="padding: 8px; border: 1px solid #ddd;">Basic Pay</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">₹${payroll.basicPay.toLocaleString()}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;">Deductions</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">₹${payroll.deductions.toLocaleString()}</td></tr>
              <tr style="background: #f0f4ff;"><td style="padding: 8px; border: 1px solid #ddd;"><strong>Net Pay</strong></td>
                  <td style="padding: 8px; border: 1px solid #ddd;"><strong>₹${payroll.netPay.toLocaleString()}</strong></td></tr>
            </table>
            <p><strong>Transaction ID:</strong> ${transactionId}</p>
            <p>Please find your salary receipt attached to this email.</p>
            <p>Regards,<br>${tenant.companyName} HR Team</p>
          </div>
        `,
        attachments: [
          {
            filename: pdfFileName,
            path: pdfFilePath,
          },
        ],
      });
    } catch (emailErr) {
      console.error('Email send error (non-fatal):', emailErr.message);
      // Email failure is non-fatal — transaction is still successful
    }

    res.json({
      success: true,
      transactionId: transaction._id,
      customTransactionId: transactionId,
      pdfPath: `/receipts/${pdfFileName}`,
    });
  } catch (err) {
    console.error('Process payroll error:', err);
    res.status(500).json({ message: 'Server error during payroll processing' });
  }
};

// GET /api/payroll/employee/:employeeId
const getPayrollByEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      _id: req.params.employeeId,
      tenantId: req.user.tenantId,
    });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const payrolls = await Payroll.find({
      employeeId: req.params.employeeId,
      tenantId: req.user.tenantId,
    })
      .populate({
        path: 'employeeId',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate('tenantId', 'companyName');

    res.json(payrolls);
  } catch (err) {
    console.error('Get payroll by employee error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getPayrolls, generatePayroll, processPayroll, getPayrollByEmployee };
