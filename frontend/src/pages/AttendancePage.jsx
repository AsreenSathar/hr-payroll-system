import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';

const TODAY = new Date().toISOString().split('T')[0];

const AttendancePage = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: TODAY,
    status: 'present',
    checkIn: '09:00',
    checkOut: '18:00',
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch all employees on mount (for the dropdown)
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get('/api/employees');
        setEmployees(res.data);
      } catch (err) {
        console.error('Fetch employees error:', err);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  // Fetch attendance whenever the selected employee changes
  const fetchAttendance = useCallback(async (empId) => {
    if (!empId) {
      setAttendance([]);
      return;
    }
    setLoadingAttendance(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.get(`/api/attendance/${empId}`);
      setAttendance(res.data);
    } catch (err) {
      console.error('Fetch attendance error:', err);
      setAttendance([]);
    } finally {
      setLoadingAttendance(false);
    }
  }, []);

  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    setSelectedEmployeeId(empId);
    setError('');
    setSuccessMsg('');
    const emp = employees.find((x) => x._id === empId);
    setSelectedEmployee(emp || null);
    fetchAttendance(empId);
  };

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
      await api.post('/api/attendance', {
        employeeId: selectedEmployeeId,
        ...form,
      });
      setSuccessMsg('Attendance marked successfully!');
      // Refresh attendance list for this employee
      await fetchAttendance(selectedEmployeeId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (s) => {
    if (s === 'present') return 'badge-success';
    if (s === 'absent') return 'badge-danger';
    return 'badge-warning';
  };

  return (
    <div className="layout">
      <Navbar />
      <div className="main-content">
        {/* Page header */}
        <div className="page-header">
          <h1>Attendance</h1>
          <p>Select an employee to view and mark attendance records</p>
        </div>

        {/* Employee selector */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="employee-select" style={{ fontWeight: 600, color: '#e2e8f0' }}>
              👤 Select Employee
            </label>
            {loadingEmployees ? (
              <LoadingSpinner text="Loading employees..." />
            ) : (
              <select
                id="employee-select"
                value={selectedEmployeeId}
                onChange={handleEmployeeChange}
              >
                <option value="">— Choose an employee —</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.userId?.name} — {emp.position || 'N/A'}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Empty state: no employee selected */}
        {!selectedEmployeeId && (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <p>Please select an employee to view attendance</p>
            </div>
          </div>
        )}

        {/* Employee-specific view */}
        {selectedEmployeeId && (
          <>
            {/* Selected employee heading */}
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e2e8f0' }}>
                {selectedEmployee?.userId?.name}
                {selectedEmployee?.position && (
                  <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#94a3b8', marginLeft: '10px' }}>
                    {selectedEmployee.position}
                  </span>
                )}
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px' }}>
              {/* Mark Attendance Form */}
              <div className="card" style={{ height: 'fit-content' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', color: '#e2e8f0' }}>
                  📅 Mark Attendance
                </h3>

                {error && (
                  <div
                    className="alert alert-error"
                    style={{
                      background: 'rgba(239,68,68,0.15)',
                      border: '1px solid rgba(239,68,68,0.4)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#fca5a5',
                      marginBottom: '16px',
                      fontSize: '0.875rem',
                    }}
                  >
                    {error}
                  </div>
                )}
                {successMsg && (
                  <div className="alert alert-success" style={{ marginBottom: '16px' }}>
                    {successMsg}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      name="date"
                      value={form.date}
                      max={TODAY}
                      onChange={handleChange}
                      required
                    />
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
                        <input
                          type="time"
                          name="checkIn"
                          value={form.checkIn}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="form-group">
                        <label>Check Out</label>
                        <input
                          type="time"
                          name="checkOut"
                          value={form.checkOut}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    disabled={saving}
                    id="mark-attendance-btn"
                  >
                    {saving ? 'Marking...' : '✔ Mark Attendance'}
                  </button>
                </form>
              </div>

              {/* Attendance Records Table */}
              <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px', color: '#e2e8f0' }}>
                  📋 Attendance Records
                </h3>
                {loadingAttendance ? (
                  <LoadingSpinner text="Loading records..." />
                ) : attendance.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <p>No attendance records found for this employee</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Check In</th>
                          <th>Check Out</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.map((a) => (
                          <tr key={a._id}>
                            <td style={{ color: '#94a3b8' }}>
                              {new Date(a.date).toLocaleDateString('en-IN')}
                            </td>
                            <td>
                              <span className={`badge ${statusBadge(a.status)}`}>
                                {a.status}
                              </span>
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
          </>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;
