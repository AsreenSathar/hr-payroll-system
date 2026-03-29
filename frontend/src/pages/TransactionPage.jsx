import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const TransactionPage = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingPayrolls, setLoadingPayrolls] = useState(true);
  const [loadingTxns, setLoadingTxns] = useState(true);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [step, setStep] = useState('list'); // 'list' | 'confirm' | 'processing' | 'success' | 'error'
  const [transactionResult, setTransactionResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    setLoadingPayrolls(true);
    setLoadingTxns(true);
    try {
      const [payRes, txnRes] = await Promise.all([
        api.get('/api/payroll'),
        api.get('/api/transactions'),
      ]);
      setPayrolls(payRes.data.filter((p) => p.status === 'pending'));
      setTransactions(txnRes.data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoadingPayrolls(false);
      setLoadingTxns(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSelectPayroll = (payroll) => {
    setSelectedPayroll(payroll);
    setStep('confirm');
  };

  const handleConfirmPay = async () => {
    setStep('processing');
    try {
      const res = await api.post(`/api/payroll/process/${selectedPayroll._id}`);
      setTransactionResult(res.data);
      setStep('success');
      fetchData(); // Refresh data in background
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Payment processing failed');
      setStep('error');
    }
  };

  const handleReset = () => {
    setSelectedPayroll(null);
    setTransactionResult(null);
    setErrorMsg('');
    setStep('list');
  };

  return (
    <div className="layout">
      <Navbar />
      <div className="main-content">
        <div className="page-header">
          <h1>Transactions</h1>
          <p>Scan & Pay — Process payroll and view payment history</p>
        </div>

        {/* ── STEP: CONFIRM ── */}
        {step === 'confirm' && selectedPayroll && (
          <div className="modal-overlay" onClick={handleReset}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '8px' }}>💳</div>
                <h2 style={{ margin: 0 }}>Confirm Salary Payment</h2>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>
                  Review the details before processing
                </p>
              </div>

              <div
                style={{
                  background: 'rgba(99,102,241,0.05)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                }}
              >
                {[
                  { label: 'Employee', value: selectedPayroll.employeeId?.userId?.name },
                  { label: 'Period', value: `${MONTH_NAMES[selectedPayroll.month]} ${selectedPayroll.year}` },
                  { label: 'Position', value: selectedPayroll.employeeId?.position || 'N/A' },
                  { label: 'Basic Pay', value: `₹${(selectedPayroll.basicPay || 0).toLocaleString()}` },
                  { label: 'Deductions', value: `-₹${(selectedPayroll.deductions || 0).toLocaleString()}`, color: '#ef4444' },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{item.label}</span>
                    <span style={{ color: item.color || '#e2e8f0', fontSize: '0.875rem', fontWeight: 500 }}>
                      {item.value}
                    </span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0' }}>
                  <span style={{ fontWeight: 700, color: '#e2e8f0' }}>Net Pay</span>
                  <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1.2rem' }}>
                    ₹{(selectedPayroll.netPay || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="btn btn-success"
                  style={{ flex: 1, justifyContent: 'center', padding: '13px' }}
                  onClick={handleConfirmPay}
                  id="confirm-pay-btn"
                >
                  ✅ Confirm & Pay Salary
                </button>
                <button className="btn btn-secondary" onClick={handleReset}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: PROCESSING ── */}
        {step === 'processing' && (
          <div className="modal-overlay">
            <div className="modal" style={{ textAlign: 'center', maxWidth: '360px' }}>
              <LoadingSpinner text="Processing payment..." />
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '8px' }}>
                Generating receipt & sending email...
              </p>
            </div>
          </div>
        )}

        {/* ── STEP: SUCCESS ── */}
        {step === 'success' && transactionResult && (
          <div className="modal-overlay" onClick={handleReset}>
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{ textAlign: 'center', maxWidth: '420px' }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(16,185,129,0.15)',
                  border: '2px solid rgba(16,185,129,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  margin: '0 auto 20px',
                }}
              >
                ✅
              </div>
              <h2 style={{ color: '#10b981', marginBottom: '8px' }}>Salary Paid Successfully!</h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '20px' }}>
                The salary has been processed and a receipt has been emailed to the employee.
              </p>
              <div
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '20px',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Transaction ID</div>
                <div style={{ fontFamily: 'monospace', color: '#818cf8', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                  {transactionResult.customTransactionId || transactionResult.transactionId}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px',
                  background: 'rgba(16,185,129,0.08)',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  color: '#6ee7b7',
                  fontSize: '0.8rem',
                }}
              >
                📧 Receipt has been emailed to the employee
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <a
                  href={`http://localhost:5000${transactionResult.pdfPath}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  id="download-receipt-btn"
                >
                  📥 Download Receipt
                </a>
                <button className="btn btn-secondary" onClick={handleReset}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: ERROR ── */}
        {step === 'error' && (
          <div className="modal-overlay" onClick={handleReset}>
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{ textAlign: 'center', maxWidth: '380px' }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(239,68,68,0.15)',
                  border: '2px solid rgba(239,68,68,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  margin: '0 auto 20px',
                }}
              >
                ❌
              </div>
              <h2 style={{ color: '#ef4444', marginBottom: '8px' }}>Payment Failed</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '20px' }}>{errorMsg}</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="btn btn-danger"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => { setStep('confirm'); }}
                  id="retry-pay-btn"
                >
                  🔄 Retry
                </button>
                <button className="btn btn-secondary" onClick={handleReset}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pending Payrolls */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: '#e2e8f0' }}>
            ⏳ Pending Payrolls — Ready to Pay
          </h3>
          {loadingPayrolls ? (
            <LoadingSpinner text="Loading pending payrolls..." />
          ) : payrolls.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <p>All payrolls processed!</p>
              <small>Go to Payroll to generate new payroll records</small>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Period</th>
                    <th>Net Pay</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payrolls.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#e2e8f0' }}>
                          {p.employeeId?.userId?.name || 'Unknown'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{p.employeeId?.position || ''}</div>
                      </td>
                      <td style={{ color: '#94a3b8' }}>
                        {MONTH_NAMES[p.month]} {p.year}
                      </td>
                      <td style={{ color: '#10b981', fontWeight: 700 }}>
                        ₹{(p.netPay || 0).toLocaleString()}
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSelectPayroll(p)}
                          id={`pay-btn-${p._id}`}
                        >
                          💳 Pay Now
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: '#e2e8f0' }}>
            📋 Transaction History
          </h3>
          {loadingTxns ? (
            <LoadingSpinner text="Loading transactions..." />
          ) : transactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💳</div>
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#e2e8f0' }}>
                          {t.employeeId?.userId?.name || 'Unknown'}
                        </div>
                      </td>
                      <td style={{ color: '#10b981', fontWeight: 700 }}>
                        ₹{(t.amount || 0).toLocaleString()}
                      </td>
                      <td>
                        <span className={`badge ${t.status === 'success' ? 'badge-success' : t.status === 'failed' ? 'badge-danger' : 'badge-warning'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                        {new Date(t.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        {t.pdfPath ? (
                          <a
                            href={`http://localhost:5000${t.pdfPath}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary btn-sm"
                          >
                            📥 PDF
                          </a>
                        ) : (
                          <span style={{ color: '#475569', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionPage;
