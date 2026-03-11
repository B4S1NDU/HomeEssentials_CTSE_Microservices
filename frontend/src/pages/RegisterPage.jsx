import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const INIT = {
  firstName: '', lastName: '', email: '', password: '', role: 'Customer',
  address: { line1: '', city: '', postalCode: '', country: 'Sri Lanka' },
};

export default function RegisterPage() {
  const [form,    setForm]    = useState(INIT);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate      = useNavigate();

  const handleChange = e =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleAddr = e =>
    setForm(f => ({ ...f, address: { ...f.address, [e.target.name]: e.target.value } }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Registration failed. Please check your details.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box" style={{ maxWidth: 520 }}>
        <div className="auth-logo">
          <div className="logo-emoji">🏪</div>
          <h1>HomeEssentials+</h1>
          <p>Create your account</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input className="form-control" name="firstName" value={form.firstName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input className="form-control" name="lastName" value={form.lastName} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input className="form-control" type="password" name="password" value={form.password} onChange={handleChange} required minLength={8} />
            <div className="form-hint">Minimum 8 characters</div>
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-control" name="role" value={form.role} onChange={handleChange}>
              <option value="Customer">Customer</option>
              <option value="Admin">Admin</option>
              <option value="StoreManager">Store Manager</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-control" name="city" value={form.address.city} onChange={handleAddr} placeholder="Colombo" />
            </div>
            <div className="form-group">
              <label className="form-label">Postal Code</label>
              <input className="form-control" name="postalCode" value={form.address.postalCode} onChange={handleAddr} placeholder="00100" />
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-full-btn" disabled={loading}>
            {loading ? 'Creating Account…' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
