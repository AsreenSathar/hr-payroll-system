import React from 'react';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const PayrollTable = ({ payrolls, onProcess }) => {
  if (!payrolls || payrolls.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">💰</div>
        <p>No payroll records found</p>
        <small style={{ color: '#475569' }}>Generate payroll for employees to get started</small>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Period</th>
            <th>Basic Pay</th>
            <th>Deductions</th>
            <th>Net Pay</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {payrolls.map((p) => {
            const emp = p.employeeId;
            const name = emp?.userId?.name || 'Unknown';
            return (
              <tr key={p._id}>
                <td>
                  <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {emp?.position || ''}
                  </div>
                </td>
                <td style={{ color: '#94a3b8' }}>
                  {MONTH_NAMES[p.month]} {p.year}
                </td>
                <td style={{ color: '#94a3b8' }}>₹{(p.basicPay || 0).toLocaleString()}</td>
                <td style={{ color: '#ef4444' }}>-₹{(p.deductions || 0).toLocaleString()}</td>
                <td style={{ color: '#10b981', fontWeight: 700 }}>
                  ₹{(p.netPay || 0).toLocaleString()}
                </td>
                <td>
                  <span
                    className={`badge ${
                      p.status === 'paid' ? 'badge-success' : 'badge-warning'
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td>
                  {p.status !== 'paid' && onProcess ? (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onProcess(p)}
                    >
                      💳 Pay
                    </button>
                  ) : (
                    <span style={{ color: '#475569', fontSize: '0.8rem' }}>Paid</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PayrollTable;
