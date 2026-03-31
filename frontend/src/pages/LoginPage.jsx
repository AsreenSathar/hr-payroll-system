import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

  const validateEmail = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Email is required.';
    if (!GMAIL_REGEX.test(trimmed))
      return 'Only Gmail addresses are allowed (example@gmail.com)';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return 'Password is required.';
    if (value.length < 8) return 'Password must be at least 8 characters';
    return '';
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    // Clear field error on change
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === 'email') {
      setFieldErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    }
    if (name === 'password') {
      setFieldErrors((prev) => ({ ...prev, password: validatePassword(value) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(formData.email);
    const passErr = validatePassword(formData.password);
    setFieldErrors({ email: emailErr, password: passErr });
    if (emailErr || passErr) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/login', {
        email: formData.email.trim(),
        password: formData.password,
      });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inlineErrorStyle = {
    color: '#f87171',
    fontSize: '0.78rem',
    marginTop: '4px',
    display: 'block',
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>⚡ HR Payroll</h1>
          <p>Sign in to your account</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="you@gmail.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoComplete="email"
            />
            {fieldErrors.email && (
              <span style={inlineErrorStyle}>{fieldErrors.email}</span>
            )}
          </div>

          {/* Password with show/hide toggle */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                style={{ paddingRight: '42px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  lineHeight: 1,
                  padding: 0,
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {fieldErrors.password && (
              <span style={inlineErrorStyle}>{fieldErrors.password}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.95rem' }}
            disabled={loading}
            id="login-btn"
          >
            {loading ? 'Signing In...' : '→ Sign In'}
          </button>
        </form>

        {loading && <LoadingSpinner text="Authenticating..." />}

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
