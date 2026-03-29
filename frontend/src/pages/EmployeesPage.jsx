import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import EmployeeCard from '../components/EmployeeCard';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';

const initialForm = {
  name: '', email: '', password: '', role: 'employee',
  department: '', position: '', salary: '', joiningDate: '',
};

const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => { fetchEmployees(); }, []);

  const openAddModal = () => {
    setEditEmployee(null);
    setForm(initialForm);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (emp) => {
    setEditEmployee(emp);
    setForm({
      name: emp.userId?.name || '',
      email: emp.userId?.email || '',
      password: '',
      role: emp.userId?.role || 'employee',
      department: emp.department || '',
      position: emp.position || '',
      salary: emp.salary || '',
      joiningDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : '',
    });
    setError('');
    setShowModal(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editEmployee) {
        await api.put(`/api/employees/${editEmployee._id}`, {
          department: form.department,
          position: form.position,
          salary: Number(form.salary),
          joiningDate: form.joiningDate,
        });
      } else {
        await api.post('/api/employees', {
          ...form,
          salary: Number(form.salary),
        });
      }
      setShowModal(false);
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee? This action cannot be undone.')) return;
    try {
      await api.delete(`/api/employees/${id}`);
      setEmployees(employees.filter((e) => e._id !== id));
    } catch (err) {
      alert('Failed to delete employee');
    }
  };

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
                {!editEmployee && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Full Name</label>
                        <input name="name" value={form.name} onChange={handleChange} required placeholder="Jane Doe" />
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="jane@company.com" />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Password</label>
                        <input type="password" name="password" value={form.password} onChange={handleChange} required placeholder="••••••••" />
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
                <div className="form-row">
                  <div className="form-group">
                    <label>Department</label>
                    <input name="department" value={form.department} onChange={handleChange} placeholder="Engineering" />
                  </div>
                  <div className="form-group">
                    <label>Position</label>
                    <input name="position" value={form.position} onChange={handleChange} placeholder="Software Engineer" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Salary (₹)</label>
                    <input type="number" name="salary" value={form.salary} onChange={handleChange} placeholder="50000" min="0" />
                  </div>
                  <div className="form-group">
                    <label>Joining Date</label>
                    <input type="date" name="joiningDate" value={form.joiningDate} onChange={handleChange} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
                    {saving ? 'Saving...' : '💾 Save Employee'}
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

export default EmployeesPage;
