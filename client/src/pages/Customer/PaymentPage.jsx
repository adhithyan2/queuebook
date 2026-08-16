import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { HiOutlineCheckCircle, HiOutlineCreditCard, HiOutlineExclamationTriangle } from 'react-icons/hi2';
import { appointmentAPI } from '../../services/api';
import Badge from '../../components/ui/Badge';

const PayButton = ({ onClick, busy, label }) => (
  <button
    onClick={onClick}
    disabled={busy}
    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {busy ? (
      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    ) : (
      <>
        <HiOutlineCreditCard className="w-4 h-4" />
        {label}
      </>
    )}
  </button>
);

export default function PaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [method, setMethod] = useState('upi');
  const [transactionId, setTransactionId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [awaitingVerification, setAwaitingVerification] = useState(false);

  const fetchPayment = useCallback(async () => {
    try {
      const res = await appointmentAPI.getPayment(id);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment details not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  const handleSubmit = async () => {
    if (method !== 'pay_at_business' && method !== 'cash' && !transactionId.trim()) {
      setMessage({ type: 'error', text: 'Please enter the transaction / reference ID from your payment' });
      return;
    }
    setBusy(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await appointmentAPI.pay(id, { method, transactionId });
      if (res.data.awaitingVerification) {
        setAwaitingVerification(true);
        setMessage({
          type: 'success',
          text: res.data.message || 'Payment details submitted. The business will confirm your payment before you receive a token.',
        });
      } else {
        setMessage({ type: 'success', text: res.data.message || 'Booking confirmed!' });
      }
      await fetchPayment();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to record payment. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || error) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-12 text-center">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Payment Not Found</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">{error || 'This appointment is not available'}</p>
        <button
          onClick={() => navigate('/customer/appointments')}
          className="mt-4 px-4 py-2 text-xs font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
        >
          Back to Appointments
        </button>
      </div>
    );
  }

  const appointment = data.appointment;
  const business = data.business;
  const paid = appointment.paymentStatus === 'paid';
  const gatewayConfigured = Boolean(business.gatewayConfigured);
  const payMode = business.paymentMode || 'both';
  const canPayOnline = (payMode === 'online' || payMode === 'both') && gatewayConfigured;
  const canPayAtBusiness = payMode === 'pay_at_business' || payMode === 'both';
  const awaiting = awaitingVerification || (appointment.paymentStatus === 'pending' && Boolean(appointment.paymentInitiatedAt));
  const isCounter = method === 'pay_at_business' || method === 'cash';

  const upiPayload = business.upiId
    ? `upi://pay?pa=${encodeURIComponent(business.upiId)}&pn=${encodeURIComponent(business.name)}&am=${appointment.advanceAmount}&cu=INR&tn=${encodeURIComponent(`QueueBook ${appointment.tokenNumber ? `Token ${appointment.tokenNumber}` : 'Advance'}`)}`
    : '';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[560px] mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Advance Payment</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {business.name} · ₹{appointment.advanceAmount}
        </p>
      </div>

      {paid ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <HiOutlineCheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Payment received</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            ₹{appointment.amount} · {appointment.paymentTransactionId || appointment.paymentMethod}
          </p>
          <button
            onClick={() => navigate('/customer/appointments')}
            className="mt-5 px-5 py-2.5 text-xs font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            Go to Appointments
          </button>
        </div>
      ) : awaiting ? (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <HiOutlineExclamationTriangle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-base font-bold text-amber-800 dark:text-amber-300">Payment submitted for verification</h3>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
            {business.name} will confirm your advance payment before you receive a token. You can track it in your appointments.
          </p>
          {appointment.paymentTransactionId && (
            <p className="text-[11px] text-amber-600 dark:text-amber-500 mt-2 font-mono">Ref: {appointment.paymentTransactionId}</p>
          )}
          <button
            onClick={() => navigate('/customer/appointments')}
            className="mt-5 px-5 py-2.5 text-xs font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            Go to Appointments
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Status</span>
              <Badge variant={appointment.status === 'pending' ? 'pending' : 'confirmed'}>
                {appointment.status === 'pending' ? 'Awaiting advance' : 'Confirmed'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm mt-3">
              <span className="text-zinc-500 dark:text-zinc-400">Advance amount</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">₹{appointment.advanceAmount}</span>
            </div>
            {appointment.servicePrice > 0 && (
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-zinc-500 dark:text-zinc-400">Service price</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">₹{appointment.servicePrice}</span>
              </div>
            )}
          </div>

          {!canPayOnline && !canPayAtBusiness ? (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <HiOutlineExclamationTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">No payment method available yet</h3>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-500">
                {business.name} has not configured how to collect the advance yet. Contact them directly to complete your booking.
              </p>
            </div>
          ) : !canPayOnline ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Pay at the business</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                This business accepts the advance at the desk. Confirm now to book your spot — the advance will be settled when you arrive.
              </p>
              <PayButton onClick={handleSubmit} busy={busy} label="Confirm at Business" />
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Scan to pay with any UPI app</h3>
              <div className="flex justify-center py-2">
                {business.paymentQr ? (
                  <img src={business.paymentQr} alt="Payment QR" className="w-52 h-52 rounded-xl border border-zinc-100 dark:border-zinc-800" />
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <QRCodeCanvas value={upiPayload} size={190} level="M" />
                  </div>
                )}
              </div>
              {business.upiId && (
                <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                  or pay to <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">{business.upiId}</span>
                </p>
              )}

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Payment Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    {canPayAtBusiness && <option value="pay_at_business">Pay at business</option>}
                    <option value="upi">UPI</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {!isCounter && (
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Transaction / Reference ID</label>
                    <input
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="e.g. UPI reference or payment ref"
                    />
                  </div>
                )}
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  {isCounter
                    ? 'Confirming books your spot. The advance will be collected at the business.'
                    : 'After paying, submit the reference here. The business verifies the payment before you receive a token — no one can mark your payment as received without confirmation.'}
                </p>
                <PayButton onClick={handleSubmit} busy={busy} label={isCounter ? 'Confirm at Business' : 'Submit payment for verification'} />
              </div>
            </div>
          )}
        </>
      )}

      {message.text && (
        <div className={`p-3 rounded-xl text-xs font-medium ${
          message.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}
    </motion.div>
  );
}
