import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Avatar from '../../components/ui/Avatar';
import { HiOutlineUser, HiOutlineMail, HiOutlineLockClosed, HiOutlinePhone, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'customer' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, role: form.role });
      navigate(form.role === 'business' ? '/business/dashboard' : '/customer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-10 text-center lg:text-left">
        <h1 className="text-3xl font-bold text-slate-900">Create account</h1>
        <p className="text-slate-500 mt-2">Join QueueBook and skip the queue</p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-xl mb-6 flex items-center gap-2"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-5 mb-4">
          <Avatar name={form.name || 'U'} size="xl" />
          <div>
            <p className="text-sm font-medium text-slate-700">Profile Photo</p>
            <p className="text-xs text-slate-400 mt-0.5">Click to upload</p>
          </div>
        </div>

        <Input
          label="Full Name"
          type="text"
          placeholder="John Doe"
          icon={<HiOutlineUser className="w-4 h-4" />}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          icon={<HiOutlineMail className="w-4 h-4" />}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <Input
          label="Phone"
          type="tel"
          placeholder="+1 (555) 000-0000"
          icon={<HiOutlinePhone className="w-4 h-4" />}
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Minimum 8 characters"
            icon={<HiOutlineLockClosed className="w-4 h-4" />}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={8}
            required
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-[calc(1.5rem+20px)] text-slate-400 hover:text-slate-600">
            {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
          </button>
        </div>
        <Input
          label="Confirm Password"
          type="password"
          placeholder="Repeat your password"
          icon={<HiOutlineLockClosed className="w-4 h-4" />}
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          required
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">I am a</label>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: 'customer', label: 'Customer', desc: 'Book appointments' },
              { value: 'business', label: 'Business', desc: 'Manage queue' },
            ].map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => setForm({ ...form, role: option.value })}
                className={`p-5 rounded-xl border-2 text-left transition-all ${
                  form.role === option.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <p className={`text-sm font-semibold ${form.role === option.value ? 'text-indigo-600' : 'text-slate-700'}`}>
                  {option.label}
                </p>
                <p className="text-xs text-slate-400 mt-1">{option.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" fullWidth size="lg" variant="gradient" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </div>
      </form>

      <p className="text-center text-sm text-slate-500 mt-8">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">Sign in</Link>
      </p>
    </div>
  );
}
