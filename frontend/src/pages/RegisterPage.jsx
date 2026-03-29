import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const RegisterPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: '',
    domain: '',
    plan: 'free',
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/register', { ...formData, role: 'admin' });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div
        className="auth-card"
        style={{ maxWidth: '520px', maxHeight: '95vh', overflowY: 'auto' }}
      >
        <div className="auth-logo">
          <h1>⚡ HR Payroll</h1>
          <p>Create your company account</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div
            style={{
              background: 'rgba(99,102,241,0.05)',
              border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
            }}
          >
            <p
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#818cf8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '12px',
              }}
            >
              Company Details
            </p>
            <div className="form-group">
              <label>Company Name</label>
              <input
                type="text"
                name="companyName"
                id="companyName"
                placeholder="Acme Corp"
                value={formData.companyName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Domain</label>
                <input
                  type="text"
                  name="domain"
                  id="domain"
                  placeholder="acme.com"
                  value={formData.domain}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Plan</label>
                <select name="plan" id="plan" value={formData.plan} onChange={handleChange}>
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(14,165,233,0.05)',
              border: '1px solid rgba(14,165,233,0.15)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
            }}
          >
            <p
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#38bdf8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '12px',
              }}
            >
              Admin Account
            </p>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                id="name"
                placeholder="John Smith"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                id="reg-email"
                placeholder="admin@acme.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                id="reg-password"
                placeholder="Min. 8 characters"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.95rem' }}
            disabled={loading}
            id="register-btn"
          >
            {loading ? 'Creating Account...' : '🚀 Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
