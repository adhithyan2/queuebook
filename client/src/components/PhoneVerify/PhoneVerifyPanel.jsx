import { useState } from 'react';
import { HiOutlinePhone, HiOutlineShieldCheck, HiOutlineRefresh } from 'react-icons/hi';
import { authAPI } from '../../services/api';

const PhoneVerifyPanel = ({ phone, onPhoneChange, verified, onVerified }) => {
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!phone || phone.trim().length < 7) {
      setError('Please enter a valid phone number');
      return;
    }
    setSending(true);
    setError('');
    try {
      await authAPI.sendOtp(phone);
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (!otp) {
      setError('Enter the code you received');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      const res = await authAPI.verifyPhone(otp);
      onVerified(res.data.user);
      setOtpSent(false);
      setOtp('');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <HiOutlinePhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <div className="flex gap-2">
          <input
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            disabled={verified}
            placeholder="+1 (555) 000-0000"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-zinc-400 disabled:opacity-50"
          />
          {!verified && (
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !phone}
              className="flex-shrink-0 px-4 py-2.5 text-xs font-medium text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {sending ? 'Sending...' : otpSent ? 'Resend Code' : 'Send Code'}
            </button>
          )}
        </div>
      </div>

      {verified && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <HiOutlineShieldCheck className="w-4 h-4" />
          Phone verified — you'll get SMS/WhatsApp queue updates
        </p>
      )}

      {!verified && otpSent && (
        <div className="relative">
          <HiOutlineRefresh className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-zinc-400"
            />
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying || otp.length < 6}
              className="flex-shrink-0 px-4 py-2.5 text-xs font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {verifying ? 'Verifying...' : 'Verify'}
            </button>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Code sent via SMS/WhatsApp. Expires in 10 minutes.</p>
        </div>
      )}

      {error && (
        <p className="text-xs font-medium text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default PhoneVerifyPanel;
