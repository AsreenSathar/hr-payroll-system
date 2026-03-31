import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import EmployeeCard from '../components/EmployeeCard';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';

const initialForm = {
  name: '', email: '', password: '', role: 'employee',
  departmentName: '', position: '', salary: '', joiningDate: '',
};

const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Controls whether user is typing a new department name or picking from dropdown
  const [addingNewDept, setAddingNewDept] = useState(false);

  // ── Fetchers ──────────────────────────────────────────────────────────────

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error('Fetch employees error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/api/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error('Fetch departments error:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  // ── Modal helpers ──────────────────────────────────────────────────────────

  const openAddModal = () => {
    setEditEmployee(null);
    setForm(initialForm);
    setAddingNewDept(false);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (emp) => {
    setEditEmployee(emp);
    setAddingNewDept(false);
    setForm({
      name: emp.userId?.name || '',
      email: emp.userId?.email || '',
      password: '',
      role: emp.userId?.role || 'employee',
      // department is now a populated object — pre-fill its name
      departmentName: emp.department?.name || '',
      position: emp.position || '',
      salary: emp.salary || '',
      joiningDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : '',
    });
    setError('');
    setShowModal(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editEmployee) {
        await api.put(`/api/employees/${editEmployee._id}`, {
          departmentName: form.departmentName,
          position: form.position,
          salary: Number(form.salary),
          joiningDate: form.joiningDate,
        });
      } else {
        await api.post('/api/employees', {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          departmentName: form.departmentName,
          position: form.position,
          salary: Number(form.salary),
          joiningDate: form.joiningDate,
        });
      }
      setShowModal(false);
      // Re-fetch both employees AND departments so new dept appears in dropdown
      await Promise.all([fetchEmployees(), fetchDepartments()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee? This action cannot be undone.')) return;
    try {
      await api.delete(`/api/employees/${id}`);
      setEmployees(employees.filter((e) => e._id !== id));
    } catch (err) {
      alert('Failed to delete employee');
    }
  };

  // ── Department field UI ────────────────────────────────────────────────────

  const renderDepartmentField = () => (
    <div className="form-group">
      <label>Department</label>
      {addingNewDept ? (
        <>
          <input
            name="departmentName"
            value={form.departmentName}
            onChange={handleChange}
            placeholder="Enter new department name"
            autoFocus
          />
          {departments.length > 0 && (
            <button
              type="button"
              onClick={() => { setAddingNewDept(false); setForm({ ...form, departmentName: '' }); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#6366f1',
                cursor: 'pointer',
                fontSize: '0.78rem',
                marginTop: '4px',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              ← Pick existing department
            </button>
          )}
        </>
      ) : (
        <>
          <select
            name="departmentName"
            value={form.departmentName}
            onChange={handleChange}
          >
            <option value="">— Select department —</option>
            {departments.map((d) => (
              <option key={d._id} value={d.name}>{d.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => { setAddingNewDept(true); setForm({ ...form, departmentName: '' }); }}
            style={{
              background: 'none',
              border: 'none',
              color: '#6366f1',
              cursor: 'pointer',
              fontSize: '0.78rem',
              marginTop: '4px',
              padding: 0,
              textDecoration: 'underline',
            }}
          >
            + Add new department
          </button>
        </>
      )}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="layout">
      <Navbar />
      <div className="main-content">
        <div className="flex-between page-header">
          <div>
            <h1>Employees</h1>
            <p>Manage your team members</p>
          </div>
          <button className="btn btn-primary" onClick={openAddModal} id="add-employee-btn">
            + Add Employee
          </button>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading employees..." />
        ) : employees.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p>No employees yet</p>
            <small>Click "Add Employee" to get started</small>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {employees.map((emp) => (
              <EmployeeCard
                key={emp._id}
                employee={emp}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>{editEmployee ? '✏️ Edit Employee' : '➕ Add New Employee'}</h2>
              {error && <div className="alert alert-error">{error}</div>}
              <form onSubmit={handleSubmit}>
                {/* New employee fields only */}
                {!editEmployee && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Full Name</label>
                        <input
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          required
                          placeholder="Jane Doe"
                        />
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          required
                          placeholder="jane@company.com"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Password</label>
                        <input
                          type="password"
                          name="password"
                          value={form.password}
                          onChange={handleChange}
                          required
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="form-group">
                        <label>Role</label>
                        <select name="role" value={form.role} onChange={handleChange}>
                          <option value="employee">Employee</option>
                          <option value="hr">HR</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Department + Position */}
                <div className="form-row">
                  {renderDepartmentField()}
                  <div className="form-group">
                    <label>Position</label>
                    <input
                      name="position"
                      value={form.position}
                      onChange={handleChange}
                      placeholder="Software Engineer"
                    />
                  </div>
                </div>

                {/* Salary + Joining Date */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Salary (₹)</label>
                    <input
                      type="number"
                      name="salary"
                      value={form.salary}
                      onChange={handleChange}
                      placeholder="50000"
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Joining Date</label>
                    <input
                      type="date"
                      name="joiningDate"
                      value={form.joiningDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    {saving ? 'Saving...' : '💾 Save Employee'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
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

export default EmployeesPage;
