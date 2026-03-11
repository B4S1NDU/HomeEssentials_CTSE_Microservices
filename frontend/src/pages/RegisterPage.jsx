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

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleAddr = e => setForm(f => ({ ...f, address: { ...f.address, [e.target.name]: e.target.value } }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Registration failed. Please check your details.');
    } finally { setLoading(false); }
  };

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#f9fafb', transition: 'all 0.2s' };
  const labelStyle = { display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #15803d 0%, #166534 50%, #14532d 100%)', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '512px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '48px' }}>🏪</span>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginTop: '12px', marginBottom: '0' }}>HomeEssentials+</h1>
          <p style={{ color: '#86efac', fontSize: '14px', marginTop: '4px' }}>Create your account to get started</p>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '32px' }}>
          {error && (
            <div style={{ display: 'flex', gap: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '12px', marginBottom: '20px', fontSize: '14px' }}>
              <span style={{ marginTop: '2px' }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>First Name *</label>
                <input style={inputStyle} name="firstName" value={form.firstName} onChange={handleChange} required placeholder="John" />
              </div>
              <div>
                <label style={labelStyle}>Last Name *</label>
                <input style={inputStyle} name="lastName" value={form.lastName} onChange={handleChange} required placeholder="Doe" />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Email Address *</label>
              <input style={inputStyle} type="email" name="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" />
            </div>

            <div>
              <label style={labelStyle}>Password *</label>
              <input style={inputStyle} type="password" name="password" value={form.password} onChange={handleChange} required minLength={8} placeholder="••••••••" />
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Minimum 8 characters</p>
            </div>

            <div>
              <label style={labelStyle}>Role</label>
              <select style={inputStyle} name="role" value={form.role} onChange={handleChange}>
                <option value="Customer">Customer</option>
                <option value="Admin">Admin</option>
                <option value="StoreManager">Store Manager</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>City</label>
                <input style={inputStyle} name="city" value={form.address.city} onChange={handleAddr} placeholder="Colombo" />
              </div>
              <div>
                <label style={labelStyle}>Postal Code</label>
                <input style={inputStyle} name="postalCode" value={form.address.postalCode} onChange={handleAddr} placeholder="00100" />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', backgroundColor: '#15803d', color: 'white', fontWeight: '600', padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', marginTop: '8px', fontSize: '14px', opacity: loading ? 0.6 : 1 }} onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#166534')} onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#15803d')}>
              {loading ? <>Creating Account...</> : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', marginTop: '20px' }}>Already have an account? <Link to="/login" style={{ color: '#15803d', fontWeight: '600', textDecoration: 'none', cursor: 'pointer' }}>Sign In</Link></p>
        </div>
      </div>
    </div>
  );
}
