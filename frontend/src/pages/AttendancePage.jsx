import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';

const AttendancePage = () => {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    checkIn: '09:00',
    checkOut: '18:00',
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, attRes] = await Promise.all([
          api.get('/api/employees'),
          api.get('/api/attendance'),
        ]);
        setEmployees(empRes.data);
        setAttendance(attRes.data);
        if (empRes.data.length > 0) {
          setForm((f) => ({ ...f, employeeId: empRes.data[0]._id }));
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post('/api/attendance', form);
      setAttendance([res.data, ...attendance]);
      setSuccessMsg('Attendance marked successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setSaving(false);
    }
  };

  const statusColor = (s) => {
    if (s === 'present') return 'badge-success';
    if (s === 'absent') return 'badge-danger';
    return 'badge-warning';
  };

  return (
    <div className="layout">
      <Navbar />
      <div className="main-content">
        <div className="page-header">
          <h1>Attendance</h1>
          <p>Mark and view employee attendance records</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px' }}>
          {/* Mark Attendance Form */}
          <div className="card" style={{ height: 'fit-content' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', color: '#e2e8f0' }}>
              📅 Mark Attendance
            </h3>
            {error && <div className="alert alert-error">{error}</div>}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}
            <form onSubmit={handleSubmit}>
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
              <div className="form-group">
                <label>Date</label>
                <input type="date" name="date" value={form.date} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={form.status} onChange={handleChange}>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="leave">Leave</option>
                </select>
              </div>
              {form.status === 'present' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Check In</label>
                    <input type="time" name="checkIn" value={form.checkIn} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Check Out</label>
                    <input type="time" name="checkOut" value={form.checkOut} onChange={handleChange} />
                  </div>
                </div>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={saving || employees.length === 0}
                id="mark-attendance-btn"
              >
                {saving ? 'Marking...' : '✔ Mark Attendance'}
              </button>
            </form>
          </div>

          {/* Attendance Table */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px', color: '#e2e8f0' }}>
              📋 Recent Attendance
            </h3>
            {loading ? (
              <LoadingSpinner text="Loading records..." />
            ) : attendance.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <p>No attendance records yet</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.slice(0, 50).map((a) => (
                      <tr key={a._id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#e2e8f0' }}>
                            {a.employeeId?.userId?.name || 'Unknown'}
                          </div>
                        </td>
                        <td style={{ color: '#94a3b8' }}>
                          {new Date(a.date).toLocaleDateString('en-IN')}
                        </td>
                        <td>
                          <span className={`badge ${statusColor(a.status)}`}>{a.status}</span>
                        </td>
                        <td style={{ color: '#94a3b8' }}>{a.checkIn || '—'}</td>
                        <td style={{ color: '#94a3b8' }}>{a.checkOut || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
