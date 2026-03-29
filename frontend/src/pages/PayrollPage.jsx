import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import PayrollTable from '../components/PayrollTable';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const PayrollPage = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicPay: '',
    deductions: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payRes, empRes] = await Promise.all([
        api.get('/api/payroll'),
        api.get('/api/employees'),
      ]);
      setPayrolls(payRes.data);
      setEmployees(empRes.data);
      if (empRes.data.length > 0) {
        setForm((f) => ({ ...f, employeeId: empRes.data[0]._id }));
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGenerate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api.post('/api/payroll/generate', {
        ...form,
        month: Number(form.month),
        year: Number(form.year),
        basicPay: Number(form.basicPay),
        deductions: Number(form.deductions),
      });
      setPayrolls([res.data, ...payrolls]);
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate payroll');
    } finally {
      setSaving(false);
    }
  };

  const handleProcess = async (payroll) => {
    setProcessing(payroll._id);
    try {
      const res = await api.post(`/api/payroll/process/${payroll._id}`);
      // Refresh payrolls after processing
      await fetchData();
      alert(`✅ Salary paid! Transaction ID: ${res.data.customTransactionId}`);
    } catch (err) {
      alert('❌ Failed to process payroll: ' + (err.response?.data?.message || 'Server error'));
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="layout">
      <Navbar />
      <div className="main-content">
        <div className="flex-between page-header">
          <div>
            <h1>Payroll</h1>
            <p>Generate and manage employee payroll records</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setError(''); setShowModal(true); }} id="generate-payroll-btn">
            + Generate Payroll
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            { label: 'Total Records', value: payrolls.length, color: '#6366f1' },
            { label: 'Pending', value: payrolls.filter((p) => p.status === 'pending').length, color: '#f59e0b' },
            { label: 'Paid', value: payrolls.filter((p) => p.status === 'paid').length, color: '#10b981' },
          ].map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px', color: '#e2e8f0' }}>
            💰 Payroll Records
          </h3>
          {loading ? (
            <LoadingSpinner text="Loading payroll..." />
          ) : (
            <PayrollTable
              payrolls={payrolls}
              onProcess={processing ? null : handleProcess}
            />
          )}
          {processing && (
            <LoadingSpinner text="Processing payment... Please wait" />
          )}
        </div>

        {/* Generate Payroll Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>💰 Generate Payroll</h2>
              {error && <div className="alert alert-error">{error}</div>}
              <form onSubmit={handleGenerate}>
                <div className="form-group">
                  <label>Employee</label>
                  <select name="employeeId" value={form.employeeId} onChange={handleChange} required>
                    {employees.map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.userId?.name} — {e.position || 'N/A'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Month</label>
                    <select name="month" value={form.month} onChange={handleChange}>
                      {MONTH_NAMES.slice(1).map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Year</label>
                    <input type="number" name="year" value={form.year} onChange={handleChange} min="2020" max="2099" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Basic Pay (₹)</label>
                    <input type="number" name="basicPay" value={form.basicPay} onChange={handleChange} required min="0" placeholder="50000" />
                  </div>
                  <div className="form-group">
                    <label>Deductions (₹)</label>
                    <input type="number" name="deductions" value={form.deductions} onChange={handleChange} min="0" placeholder="5000" />
                  </div>
                </div>
                {form.basicPay && (
                  <div
                    style={{
                      padding: '12px',
                      background: 'rgba(16,185,129,0.1)',
                      border: '1px solid rgba(16,185,129,0.2)',
                      borderRadius: '10px',
                      marginBottom: '16px',
                    }}
                  >
                    <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Net Pay: </span>
                    <span style={{ color: '#10b981', fontWeight: 700, fontSize: '1.1rem' }}>
                      ₹{(Number(form.basicPay) - Number(form.deductions || 0)).toLocaleString()}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
                    {saving ? 'Generating...' : '💾 Generate'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollPage;
