import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      const response = await axios.post(
        'http://localhost:5000/api/auth/register',
        formData
      );

      alert(response.data.message || 'Registrasi berhasil');
      navigate('/login');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Registrasi gagal'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)'
      }}
    >
      <div
        className="card border-0 shadow-lg"
        style={{
          width: '100%',
          maxWidth: '450px',
          borderRadius: '20px'
        }}
      >
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <div
              style={{
                width: 70,
                height: 70,
                borderRadius: '50%',
                background: '#EEF2FF',
                margin: '0 auto 15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '30px'
              }}
            >
              👤
            </div>

            <h2 className="fw-bold">Create Account</h2>

            <p className="text-muted">
              Register to access FULLSTOK HR Dashboard
            </p>
          </div>

          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Full Name
              </label>

              <input
                type="text"
                name="name"
                className="form-control form-control-lg"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">
                Email Address
              </label>

              <input
                type="email"
                name="email"
                className="form-control form-control-lg"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">
                Password
              </label>

              <input
                type="password"
                name="password"
                className="form-control form-control-lg"
                placeholder="Create password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold">
                Account Role
              </label>

              <select
                name="role"
                className="form-select form-select-lg"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="user">Employee</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg w-100"
              style={{
                borderRadius: '12px'
              }}
            >
              {loading
                ? 'Creating Account...'
                : 'Create Account'}
            </button>
          </form>

          <hr className="my-4" />

          <div className="text-center">
            <span className="text-muted">
              Already have an account?
            </span>

            <Link
              to="/login"
              className="text-decoration-none fw-bold ms-2"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
