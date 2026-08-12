import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
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
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, role: form.role, phone: form.phone });
      navigate(form.role === 'business' ? '/business/dashboard' : '/customer/dashboard');
    } catch (err) { setError(err.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Create account</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">Join QueueBook and skip the queue</p>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm p-3.5 rounded-xl mb-5 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Full Name" type="text" placeholder="John Doe"
            icon={<HiOutlineUser className="w-4 h-4" />}
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" type="email" placeholder="you@example.com"
            icon={<HiOutlineMail className="w-4 h-4" />}
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Phone" type="tel" placeholder="+1 (555) 000-0000"
            icon={<HiOutlinePhone className="w-4 h-4" />}
            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div className="relative">
            <Input label="Password" type={showPassword ? 'text' : 'password'} placeholder="Min 8 characters"
              icon={<HiOutlineLockClosed className="w-4 h-4" />}
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
              {showPassword ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Input label="Confirm Password" type="password" placeholder="Repeat your password"
          icon={<HiOutlineLockClosed className="w-4 h-4" />}
          value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />

        <div className="space-y-2">
          <label className="block text-[13px] font-medium text-zinc-700 dark:text-zinc-300">I am a</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'customer', label: 'Customer', desc: 'Book appointments' },
              { value: 'business', label: 'Business', desc: 'Manage queue' },
            ].map((option) => (
              <button type="button" key={option.value} onClick={() => setForm({ ...form, role: option.value })}
                className={`p-3.5 rounded-xl border-2 text-left transition-all duration-150 ${
                  form.role === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}>
                <p className={`text-sm font-semibold ${form.role === option.value ? 'text-primary' : 'text-zinc-700 dark:text-zinc-300'}`}>{option.label}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">{option.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-1">
          <Button type="submit" fullWidth size="lg" variant="gradient" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </div>
      </form>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary hover:text-primary-dark transition-colors">Sign in</Link>
      </p>
    </div>
  );
}
