import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, CheckCircle } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Alert from '../components/common/Alert';

export default function RegisterPage() {
  const { register, isAuthenticated, authError, clearError } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    // Client-side validations
    if (!formData.email.trim()) {
      setFormError('Please provide a valid university email.');
      return;
    }
    if (!formData.password) {
      setFormError('Please specify a secure password.');
      return;
    }
    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters in length.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      setSuccessMessage(
        response?.message || 'Registration successful! Your student account has been created.'
      );

      // Smooth transition to login view
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create Student Account</h2>
        <p className="text-xs text-slate-500">Join the campus discovery and facility network</p>
      </div>

      {successMessage ? (
        <div className="space-y-4 text-center py-4">
          <Alert type="success" title="Success" message={successMessage} />
          <p className="text-xs text-slate-500">Redirecting to login portal in a moment...</p>
          <Link to="/login">
            <Button variant="primary" size="sm" icon={CheckCircle} className="w-full">
              Proceed to Sign In
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {(formError || authError) && (
            <Alert
              type="error"
              message={formError || authError}
              onClose={() => {
                setFormError(null);
                clearError();
              }}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                id="firstName"
                name="firstName"
                label="First Name"
                placeholder="Ananya"
                value={formData.firstName}
                onChange={handleChange}
                autoComplete="given-name"
              />
              <Input
                id="lastName"
                name="lastName"
                label="Last Name"
                placeholder="Sharma"
                value={formData.lastName}
                onChange={handleChange}
                autoComplete="family-name"
              />
            </div>

            <Input
              id="email"
              name="email"
              type="email"
              label="University Email"
              placeholder="ananya.sharma@lpu.in"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />

            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="••••••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              helperText="Minimum 8 characters"
              autoComplete="new-password"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 focus:outline-hidden p-1 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              label="Confirm Password"
              placeholder="••••••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              icon={UserPlus}
              className="w-full mt-2"
            >
              Register as Student
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-600 border-t border-slate-100">
            <span>Already have an account? </span>
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
