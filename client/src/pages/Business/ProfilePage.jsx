import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { businessAPI, customerAPI } from '../../services/api';
import ImageUploader from '../../components/business/ImageUploader';
import {
  HiOutlineBuildingStorefront, HiOutlineMapPin, HiOutlinePhone,
  HiOutlineClock, HiOutlineCheck, HiOutlinePhoto, HiOutlineStar,
  HiOutlineUsers,   HiOutlinePlus, HiOutlinePencil, HiOutlineTrash,
  HiOutlineXMark, HiOutlineCreditCard, HiOutlineEye, HiOutlineSquares2X2,
  HiOutlineArrowRight, HiOutlineGlobeAlt,
} from 'react-icons/hi2';

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const todayKey = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];

const tabs = [
  { id: 'basic', label: 'Basic Information', icon: HiOutlineBuildingStorefront },
  { id: 'services', label: 'Services', icon: HiOutlineSquares2X2 },
  { id: 'staff', label: 'Staff', icon: HiOutlineUsers },
  { id: 'location', label: 'Location', icon: HiOutlineMapPin },
  { id: 'hours', label: 'Opening Hours', icon: HiOutlineClock },
  { id: 'payments', label: 'Payments', icon: HiOutlineCreditCard },
  { id: 'preview', label: 'Preview', icon: HiOutlineEye },
];

const inputClass = "w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";
const smallInputClass = "h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-primary/20";

const timeToMin = (t) => {
  if (!t || !String(t).includes(':')) return null;
  const [h, m] = String(t).split(':').map(Number);
  return Number.isNaN(h) || Number.isNaN(m) ? null : h * 60 + m;
};

const isOpenNow = (openingHours, timeSlots) => {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const entry = (openingHours || []).find((h) => h && h.day && String(h.day).toLowerCase() === todayKey.toLowerCase());
  let open = null;
  let close = null;
  if (entry) {
    if (entry.closed) return false;
    open = timeToMin(entry.open);
    close = timeToMin(entry.close);
  } else if (timeSlots?.open) {
    open = timeToMin(timeSlots.open);
    close = timeToMin(timeSlots.close);
  }
  if (open === null || close === null) return false;
  return nowMin >= open && nowMin < close;
};

function SaveButton({ onClick, saving, saved, label = 'Save Changes' }) {
  return (
    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={onClick} disabled={saving}
      className="h-10 px-6 rounded-xl gradient-primary text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-all">
      {saving ? 'Saving...' : saved ? <><HiOutlineCheck className="w-4 h-4" /> Saved</> : label}
    </motion.button>
  );
}

function SectionCard({ icon: Icon, title, children, action }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    inactive: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
    temporarily_closed: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  };
  const labels = { active: 'Active', inactive: 'Inactive', temporarily_closed: 'Temporarily Closed' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold rounded-full ${map[status] || map.active}`}>
      {labels[status] || 'Active'}
    </span>
  );
}

const defaultHours = () => dayNames.map((day) => ({ day, open: '09:00', close: '17:00', closed: false }));
const defaultAvailability = () => Object.fromEntries(dayKeys.map((d) => [d, { open: '09:00', close: '17:00', off: false, breakStart: '', breakEnd: '' }]));

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [basic, setBasic] = useState({ name: '', description: '', category: '', subcategory: '', phone: '', email: '', website: '', logo: '', coverImage: '', businessStatus: 'active' });
  const [hours, setHours] = useState(defaultHours());
  const [loc, setLoc] = useState({ address: '', city: '', state: '', pincode: '', lat: '', lng: '' });
  const [payments, setPayments] = useState({ requirePayment: false, advanceAmount: 0, paymentMode: 'both', upiId: '', paymentQr: '' });
  const [detecting, setDetecting] = useState(false);
  const [previewLive, setPreviewLive] = useState(null);

  const loadProfile = (p) => {
    setProfile(p);
    setBasic({
      name: p.name || '', description: p.description || '', category: p.category || '',
      subcategory: p.subcategory || '', phone: p.phone || '', email: p.email || '',
      website: p.website || '', logo: p.logo || '', coverImage: p.coverImage || '',
      businessStatus: p.businessStatus || 'active',
    });
    setHours(p.openingHours?.length ? p.openingHours : defaultHours());
    setLoc({
      address: p.address || '', city: p.city || '', state: p.state || '', pincode: p.pincode || '',
      lat: p.location?.coordinates?.[1] ? String(p.location.coordinates[1]) : '',
      lng: p.location?.coordinates?.[0] ? String(p.location.coordinates[0]) : '',
    });
    setPayments({
      requirePayment: Boolean(p.payments?.requirePayment),
      advanceAmount: Number(p.payments?.advanceAmount) || 0,
      paymentMode: p.payments?.paymentMode || 'both',
      upiId: p.payments?.upiId || '',
      paymentQr: p.payments?.paymentQr || '',
    });
  };

  useEffect(() => {
    businessAPI.getProfile()
      .then((res) => { const p = res.data.business || res.data; loadProfile(p); })
      .catch(() => setSaveError('Failed to load your business profile'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab !== 'preview' || !profile?._id) return;
    customerAPI.getBusinessPublic(profile._id)
      .then((res) => setPreviewLive(res.data))
      .catch(() => setPreviewLive(null));
  }, [activeTab, profile?._id]);

  const flashSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const runSave = async (payload) => {
    setSaving(true); setSaved(false); setSaveError('');
    try {
      const res = await businessAPI.createOrUpdateProfile(payload);
      loadProfile(res.data.business || res.data);
      flashSaved();
      return true;
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save. Please check the form and try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveBasic = () => runSave({ ...basic, category: String(basic.category).trim().toLowerCase(), subcategory: String(basic.subcategory).trim().toLowerCase() });
  const saveHours = () => runSave({ openingHours: hours });
  const saveLocation = () => {
    const lat = parseFloat(loc.lat);
    const lng = parseFloat(loc.lng);
    const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lng);
    return runSave({
      address: loc.address, city: loc.city, state: loc.state, pincode: loc.pincode,
      location: hasCoords ? { type: 'Point', coordinates: [lng, lat] } : undefined,
    });
  };
  const savePayments = () => runSave({ payments });

  const handleDetectLocation = () => {
    if (!navigator.geolocation) { setSaveError('Geolocation is not supported by your browser'); return; }
    setDetecting(true); setSaveError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const addr = data.address || {};
          setLoc((prev) => ({
            ...prev,
            address: data.display_name || prev.address,
            city: addr.city || addr.town || addr.village || prev.city,
            state: addr.state || prev.state,
            pincode: addr.postcode || prev.pincode,
            lat: String(latitude),
            lng: String(longitude),
          }));
          flashSaved();
        } catch {
          setSaveError('Failed to get address from coordinates');
        } finally {
          setDetecting(false);
        }
      },
      () => { setDetecting(false); setSaveError('Failed to detect location. Please enable location access.'); }
    );
  };

  const updateBasic = (k, v) => setBasic((prev) => ({ ...prev, [k]: v }));
  const updateHour = (i, k, v) => setHours((prev) => prev.map((h, idx) => (idx === i ? { ...h, [k]: v } : h)));
  const updateLoc = (k, v) => setLoc((prev) => ({ ...prev, [k]: v }));
  const updatePayments = (k, v) => setPayments((prev) => ({ ...prev, [k]: v }));

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  const refreshProfile = (res) => {
    loadProfile(res.data.business || res.data);
    setSaveError('');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Business Profile</h1>
        <StatusBadge status={basic.businessStatus} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide -mx-1 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSaveError(''); }}
              className={`flex-shrink-0 flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold transition-all ${
                active ? 'gradient-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800 hover:text-primary'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {saveError && (
        <div className="mb-5 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm p-3.5 rounded-xl">
          {saveError}
        </div>
      )}

      {/* ============ TAB 1: BASIC ============ */}
      {activeTab === 'basic' && (
        <div className="space-y-5 max-w-3xl">
          <SectionCard icon={HiOutlineBuildingStorefront} title="General Information"
            action={<SaveButton onClick={saveBasic} saving={saving} saved={saved} />}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Business Name *</label>
                  <input value={basic.name} onChange={(e) => updateBasic('name', e.target.value)} className={inputClass} placeholder="Your business name" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Category *</label>
                  <input list="qb-categories" value={basic.category} onChange={(e) => updateBasic('category', e.target.value)} className={inputClass} placeholder="e.g. salon, clinic, hospital" />
                  <datalist id="qb-categories">
                    {['salon', 'hospital', 'clinic', 'restaurant', 'office', 'laboratory'].map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Subcategory</label>
                <input value={basic.subcategory} onChange={(e) => updateBasic('subcategory', e.target.value)} className={inputClass} placeholder="e.g. unisex salon, dental clinic" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Description</label>
                <textarea value={basic.description} onChange={(e) => updateBasic('description', e.target.value)} rows={3}
                  className={`${inputClass} h-auto py-3 resize-none`} placeholder="Describe your business" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Phone</label>
                  <input value={basic.phone} onChange={(e) => updateBasic('phone', e.target.value)} className={inputClass} placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Email</label>
                  <input value={basic.email} onChange={(e) => updateBasic('email', e.target.value)} className={inputClass} placeholder="you@business.com" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Website</label>
                <input value={basic.website} onChange={(e) => updateBasic('website', e.target.value)} className={inputClass} placeholder="https://example.com" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Business Status</label>
                <select value={basic.businessStatus} onChange={(e) => updateBasic('businessStatus', e.target.value)} className={inputClass}>
                  <option value="active">Active — accepting bookings</option>
                  <option value="temporarily_closed">Temporarily Closed</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={HiOutlinePhoto} title="Logo & Cover">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Logo</label>
                <input value={basic.logo} onChange={(e) => updateBasic('logo', e.target.value)} className={inputClass} placeholder="https://.../logo.png" />
                <div className="mt-2">
                  <ImageUploader value={basic.logo} onChange={(url) => updateBasic('logo', url)} compact />
                </div>
                {basic.logo ? <img src={basic.logo} alt="Logo" className="mt-3 w-16 h-16 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800" /> : null}
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Cover Image</label>
                <input value={basic.coverImage} onChange={(e) => updateBasic('coverImage', e.target.value)} className={inputClass} placeholder="https://.../cover.jpg" />
                <div className="mt-2">
                  <ImageUploader value={basic.coverImage} onChange={(url) => updateBasic('coverImage', url)} compact />
                </div>
                {basic.coverImage ? <img src={basic.coverImage} alt="Cover" className="mt-3 w-full h-24 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800" /> : null}
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 mt-3">You can paste an image URL or upload an image (JPG, PNG, WEBP, GIF — max 5 MB).</p>
          </SectionCard>
        </div>
      )}

      {/* ============ TAB 2: SERVICES ============ */}
      {activeTab === 'services' && (
        <ServicesTab profile={profile} refreshProfile={refreshProfile} />
      )}

      {/* ============ TAB 3: STAFF ============ */}
      {activeTab === 'staff' && (
        <StaffTab profile={profile} refreshProfile={refreshProfile} />
      )}

      {/* ============ TAB 4: LOCATION ============ */}
      {activeTab === 'location' && (
        <div className="space-y-5 max-w-3xl">
          <SectionCard icon={HiOutlineMapPin} title="Address & Location"
            action={<SaveButton onClick={saveLocation} saving={saving} saved={saved} />}>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Address</label>
                <input value={loc.address} onChange={(e) => updateLoc('address', e.target.value)} className={inputClass} placeholder="Shop number, street, area" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">City</label>
                  <input value={loc.city} onChange={(e) => updateLoc('city', e.target.value)} className={inputClass} placeholder="Coimbatore" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">State</label>
                  <input value={loc.state} onChange={(e) => updateLoc('state', e.target.value)} className={inputClass} placeholder="Tamil Nadu" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Pincode</label>
                  <input value={loc.pincode} onChange={(e) => updateLoc('pincode', e.target.value)} className={inputClass} placeholder="641001" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Latitude</label>
                  <input type="number" step="any" value={loc.lat} onChange={(e) => updateLoc('lat', e.target.value)} className={inputClass} placeholder="11.0168" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Longitude</label>
                  <input type="number" step="any" value={loc.lng} onChange={(e) => updateLoc('lng', e.target.value)} className={inputClass} placeholder="76.9558" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <motion.button type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  onClick={handleDetectLocation} disabled={detecting}
                  className="h-11 px-4 rounded-xl bg-primary/10 text-primary text-sm font-semibold flex items-center gap-2 disabled:opacity-50 transition-all">
                  <HiOutlineMapPin className="w-4 h-4" />
                  {detecting ? 'Detecting...' : 'Detect Location'}
                </motion.button>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Detects your current coordinates and fills the address automatically.
                </span>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ============ TAB 5: OPENING HOURS ============ */}
      {activeTab === 'hours' && (
        <div className="space-y-5 max-w-2xl">
          <SectionCard icon={HiOutlineClock} title="Weekly Opening Hours"
            action={<SaveButton onClick={saveHours} saving={saving} saved={saved} />}>
            <div className="space-y-3">
              {hours.map((h, i) => (
                <div key={h.day} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 w-20 flex-shrink-0">{h.day.slice(0, 3)}</span>
                  <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                    <input type="checkbox" checked={h.closed} onChange={(e) => updateHour(i, 'closed', e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-zinc-300 text-primary focus:ring-primary/20" />
                    <span className="text-[10px] text-zinc-400">Closed</span>
                  </label>
                  {!h.closed && (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input type="time" value={h.open} onChange={(e) => updateHour(i, 'open', e.target.value)} className={smallInputClass} />
                      <span className="text-[10px] text-zinc-400">to</span>
                      <input type="time" value={h.close} onChange={(e) => updateHour(i, 'close', e.target.value)} className={smallInputClass} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ============ TAB 6: PAYMENTS ============ */}
      {activeTab === 'payments' && (
        <div className="space-y-5 max-w-3xl">
          <SectionCard icon={HiOutlineCreditCard} title="Payment Settings"
            action={<SaveButton onClick={savePayments} saving={saving} saved={saved} />}>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Payment gateway integration is not active yet. These settings prepare your business for online advance payments.
            </p>
            <div className="space-y-4">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={payments.requirePayment} onChange={(e) => updatePayments('requirePayment', e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 text-primary focus:ring-primary/20" />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Require advance payment for bookings</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Advance Amount (₹)</label>
                  <input type="number" min="0" value={payments.advanceAmount} onChange={(e) => updatePayments('advanceAmount', e.target.value)} className={inputClass} placeholder="0" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Payment Mode</label>
                  <select value={payments.paymentMode} onChange={(e) => updatePayments('paymentMode', e.target.value)} className={inputClass}>
                    <option value="both">Online + Pay at business</option>
                    <option value="online">Online only</option>
                    <option value="pay_at_business">Pay at business</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">UPI ID (for QR payments)</label>
                <input value={payments.upiId} onChange={(e) => updatePayments('upiId', e.target.value)} className={inputClass} placeholder="business@upi" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Payment QR Image</label>
                <input value={payments.paymentQr} onChange={(e) => updatePayments('paymentQr', e.target.value)} className={inputClass} placeholder="https://.../qr.png" />
                <div className="mt-2">
                  <ImageUploader value={payments.paymentQr} onChange={(url) => updatePayments('paymentQr', url)} compact />
                </div>
                {payments.paymentQr ? <img src={payments.paymentQr} alt="QR" className="mt-3 w-24 h-24 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800" /> : null}
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ============ TAB 7: PREVIEW ============ */}
      {activeTab === 'preview' && (
        <PreviewTab profile={profile} live={previewLive} />
      )}
    </motion.div>
  );
}

/* ---------------- SERVICES TAB ---------------- */

function ServicesTab({ profile, refreshProfile }) {
  const services = profile?.services || [];
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);

  const empty = { name: '', price: '', duration: '30', description: '', isAvailable: true };

  const submit = async () => {
    if (!draft) return;
    if (!String(draft.name || '').trim()) { alert('Service name is required'); return; }
    const price = parseFloat(draft.price) || 0;
    const duration = parseFloat(draft.duration) || 30;
    if (price < 0) { alert('Price cannot be negative'); return; }
    if (duration <= 0) { alert('Duration must be greater than 0'); return; }
    setBusy(true);
    try {
      const payload = { name: draft.name.trim(), price, duration, description: draft.description || '', isAvailable: draft.isAvailable };
      const res = draft._id ? await businessAPI.updateService(draft._id, payload) : await businessAPI.addService(payload);
      refreshProfile(res);
      setDraft(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save service');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this service? It will be removed from all staff too.')) return;
    try {
      const res = await businessAPI.deleteService(id);
      refreshProfile(res);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete service');
    }
  };

  const toggle = async (s) => {
    try {
      const res = await businessAPI.updateService(s._id, { isAvailable: !s.isAvailable });
      refreshProfile(res);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update service');
    }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <SectionCard icon={HiOutlineSquares2X2} title="Services"
        action={<button onClick={() => setDraft(draft ? null : { ...empty })} className="h-10 px-4 rounded-xl bg-primary/10 text-primary text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/20 transition-all">
          {draft ? <HiOutlineXMark className="w-4 h-4" /> : <HiOutlinePlus className="w-4 h-4" />} {draft ? 'Cancel' : 'Add Service'}
        </button>}>
        {draft && (
          <div className="mb-5 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Service Name *</label>
                <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputClass} placeholder="Haircut" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Price (₹)</label>
                <input type="number" min="0" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} className={inputClass} placeholder="150" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Duration (min)</label>
                <input type="number" min="1" value={draft.duration} onChange={(e) => setDraft({ ...draft, duration: e.target.value })} className={inputClass} placeholder="30" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Description</label>
              <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className={inputClass} placeholder="Short description (optional)" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={draft.isAvailable} onChange={(e) => setDraft({ ...draft, isAvailable: e.target.checked })} className="w-4 h-4 rounded border-zinc-300 text-primary" />
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Available for booking</span>
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setDraft(null)} className="h-9 px-4 rounded-xl text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
              <button onClick={submit} disabled={busy} className="h-9 px-4 rounded-xl gradient-primary text-white text-xs font-semibold disabled:opacity-50">{busy ? 'Saving...' : draft._id ? 'Update Service' : 'Add Service'}</button>
            </div>
          </div>
        )}

        {services.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-6">No services yet. Add your first service to start accepting bookings.</p>
        )}
        <div className="space-y-2.5">
          {services.map((s) => (
            <div key={String(s._id)} className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
              <button onClick={() => toggle(s)} className={`w-9 h-6 rounded-full transition-colors flex-shrink-0 ${s.isAvailable ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                <span className={`block w-4 h-4 bg-white rounded-full shadow transform transition-transform ${s.isAvailable ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{s.name}</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  ₹{Number(s.price) || 0} · {s.duration || 30} min{s.description ? ` · ${s.description}` : ''}
                </p>
              </div>
              <button onClick={() => setDraft({ name: s.name, price: s.price, duration: s.duration, description: s.description || '', isAvailable: s.isAvailable, _id: s._id })} className="p-2 rounded-lg text-zinc-400 hover:text-primary hover:bg-primary/10 transition-colors">
                <HiOutlinePencil className="w-4 h-4" />
              </button>
              <button onClick={() => remove(s._id)} className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                <HiOutlineTrash className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

/* ---------------- STAFF TAB ---------------- */

function StaffTab({ profile, refreshProfile }) {
  const staff = profile?.staff || [];
  const services = profile?.services || [];
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [openAvailability, setOpenAvailability] = useState(null);

  const empty = { name: '', role: '', phone: '', image: '', services: [], isActive: true, availability: defaultAvailability() };

  const submit = async () => {
    if (!draft) return;
    if (!String(draft.name || '').trim()) { alert('Staff name is required'); return; }
    for (const key of dayKeys) {
      const d = draft.availability?.[key];
      if (d && !d.off) {
        const o = timeToMin(d.open); const c = timeToMin(d.close);
        if (o !== null && c !== null && c <= o) { alert(`Invalid availability on ${key}`); return; }
        const bs = d.breakStart ? timeToMin(d.breakStart) : null;
        const be = d.breakEnd ? timeToMin(d.breakEnd) : null;
        if ((bs !== null || be !== null) && (bs === null || be === null || be <= bs)) {
          alert(`Invalid break on ${key}`); return;
        }
        if (bs !== null && (bs < o || be > c)) { alert(`Break must be within working hours on ${key}`); return; }
      }
    }
    setBusy(true);
    try {
      const payload = {
        name: draft.name.trim(), role: draft.role || '', phone: draft.phone || '', image: draft.image || '',
        services: draft.services || [], isActive: draft.isActive, availability: draft.availability || {},
      };
      const res = draft._id ? await businessAPI.updateStaff(draft._id, payload) : await businessAPI.addStaff(payload);
      refreshProfile(res);
      setDraft(null);
      setOpenAvailability(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save staff member');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this staff member?')) return;
    try {
      const res = await businessAPI.deleteStaff(id);
      refreshProfile(res);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete staff member');
    }
  };

  const toggle = async (m) => {
    try {
      const res = await businessAPI.updateStaff(m._id, { isActive: !m.isActive });
      refreshProfile(res);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update staff member');
    }
  };

  const toggleService = (id) => setDraft((prev) => ({
    ...prev,
    services: prev.services.includes(id) ? prev.services.filter((x) => x !== id) : [...prev.services, id],
  }));

  return (
    <div className="space-y-5 max-w-4xl">
      <SectionCard icon={HiOutlineUsers} title="Staff & Professionals"
        action={<button onClick={() => setDraft(draft ? null : { ...empty })} className="h-10 px-4 rounded-xl bg-primary/10 text-primary text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/20 transition-all">
          {draft ? <HiOutlineXMark className="w-4 h-4" /> : <HiOutlinePlus className="w-4 h-4" />} {draft ? 'Cancel' : 'Add Staff'}
        </button>}>
        {draft && (
          <div className="mb-5 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Name *</label>
                <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputClass} placeholder="Arun" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Role</label>
                <input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} className={inputClass} placeholder="Senior Stylist" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Phone</label>
                <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} className={inputClass} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Profile Image</label>
                <input value={draft.image} onChange={(e) => setDraft({ ...draft, image: e.target.value })} className={inputClass} placeholder="https://.../avatar.png" />
                <div className="mt-2">
                  <ImageUploader value={draft.image} onChange={(url) => setDraft({ ...draft, image: url })} compact />
                </div>
              </div>
            </div>
            {services.length > 0 && (
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Offers Services</label>
                <div className="flex flex-wrap gap-2">
                  {services.map((s) => {
                    const selected = draft.services.includes(String(s._id));
                    return (
                      <button key={String(s._id)} type="button" onClick={() => toggleService(String(s._id))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selected ? 'bg-primary text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div>
              <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Weekly Availability</label>
              <div className="space-y-2">
                {dayKeys.map((key, i) => {
                  const d = draft.availability?.[key] || { open: '09:00', close: '17:00', off: false };
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 w-16 flex-shrink-0 capitalize">{dayNames[i].slice(0, 3)}</span>
                      <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                        <input type="checkbox" checked={d.off} onChange={(e) => setDraft({ ...draft, availability: { ...draft.availability, [key]: { ...d, off: e.target.checked } } })} className="w-3.5 h-3.5 rounded border-zinc-300 text-primary" />
                        <span className="text-[10px] text-zinc-400">Off</span>
                      </label>
                      {!d.off && (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input type="time" value={d.open} onChange={(e) => setDraft({ ...draft, availability: { ...draft.availability, [key]: { ...d, open: e.target.value } } })} className={smallInputClass} />
                          <span className="text-[10px] text-zinc-400">to</span>
                          <input type="time" value={d.close} onChange={(e) => setDraft({ ...draft, availability: { ...draft.availability, [key]: { ...d, close: e.target.value } } })} className={smallInputClass} />
                          <span className="text-[10px] text-zinc-400">break</span>
                          <input type="time" value={d.breakStart || ''} onChange={(e) => setDraft({ ...draft, availability: { ...draft.availability, [key]: { ...d, breakStart: e.target.value } } })} className={`${smallInputClass} w-20`} />
                          <span className="text-[10px] text-zinc-400">to</span>
                          <input type="time" value={d.breakEnd || ''} onChange={(e) => setDraft({ ...draft, availability: { ...draft.availability, [key]: { ...d, breakEnd: e.target.value } } })} className={`${smallInputClass} w-20`} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} className="w-4 h-4 rounded border-zinc-300 text-primary" />
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Active</span>
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setDraft(null)} className="h-9 px-4 rounded-xl text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
              <button onClick={submit} disabled={busy} className="h-9 px-4 rounded-xl gradient-primary text-white text-xs font-semibold disabled:opacity-50">{busy ? 'Saving...' : draft._id ? 'Update Staff' : 'Add Staff'}</button>
            </div>
          </div>
        )}

        {staff.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-6">No staff added yet. Add your team so customers can book a specific professional.</p>
        )}
        <div className="space-y-2.5">
          {staff.map((m) => (
            <div key={String(m._id)} className="p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
              <div className="flex items-center gap-3">
                <button onClick={() => toggle(m)} className={`w-9 h-6 rounded-full transition-colors flex-shrink-0 ${m.isActive ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                  <span className={`block w-4 h-4 bg-white rounded-full shadow transform transition-transform ${m.isActive ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
                {m.image ? <img src={m.image} alt={m.name} className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-800" /> : (
                  <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {String(m.name || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{m.name} {m.role ? <span className="text-[11px] font-normal text-zinc-500">· {m.role}</span> : null}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    {m.services?.length || 0} service{(m.services?.length || 0) === 1 ? '' : 's'}
                    {m.phone ? ` · ${m.phone}` : ''}
                  </p>
                </div>
                <button onClick={() => setOpenAvailability(openAvailability === String(m._id) ? null : String(m._id))} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors">
                  {openAvailability === String(m._id) ? 'Hide Hours' : 'Hours'}
                </button>
                <button onClick={() => setDraft({ ...m.toObject ? m.toObject() : m, services: (m.services || []).map((x) => String(x)), availability: m.availability || defaultAvailability(), _id: m._id })} className="p-2 rounded-lg text-zinc-400 hover:text-primary hover:bg-primary/10 transition-colors">
                  <HiOutlinePencil className="w-4 h-4" />
                </button>
                <button onClick={() => remove(m._id)} className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
              {openAvailability === String(m._id) && (
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {dayKeys.map((key, i) => {
                    const d = (m.availability || {})[key];
                    const hasBreak = d && !d.off && d.breakStart && d.breakEnd;
                    return (
                      <div key={key} className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span className="font-semibold capitalize mr-1">{dayNames[i].slice(0, 3)}:</span>
                        {!d || d.off ? 'Off' : `${d.open}–${d.close}${hasBreak ? ` (break ${d.breakStart}–${d.breakEnd})` : ''}`}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

/* ---------------- PREVIEW TAB ---------------- */

function PreviewTab({ profile, live }) {
  if (!profile) return null;
  const open = isOpenNow(profile.openingHours, profile.timeSlots);
  const liveQueue = live?.liveQueue;
  const payments = profile.payments || {};

  return (
    <div className="max-w-2xl">
      <div className="overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="h-28 bg-gradient-to-br from-primary to-violet-600 relative">
          {profile.coverImage && <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />}
          {profile.logo && <img src={profile.logo} alt="Logo" className="absolute -bottom-6 left-5 w-14 h-14 rounded-2xl object-cover border-2 border-white dark:border-zinc-900" />}
        </div>
        <div className="p-5 pt-8">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{profile.name}</h3>
            <StatusBadge status={profile.businessStatus} />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize mt-0.5">{profile.category}{profile.subcategory ? ` · ${profile.subcategory}` : ''}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium">
              <HiOutlineStar className="w-3.5 h-3.5 text-amber-500" /> {Number(profile.rating) || '—'}
            </span>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${open ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} /> {open ? 'Open Now' : 'Closed'}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium">
              <HiOutlineMapPin className="w-3.5 h-3.5" /> {profile.city || profile.address || 'No address'}
            </span>
            {profile.phone && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium">
                <HiOutlinePhone className="w-3.5 h-3.5" /> {profile.phone}
              </span>
            )}
            {profile.website && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium">
                <HiOutlineGlobeAlt className="w-3.5 h-3.5" /> {profile.website}
              </span>
            )}
          </div>
        </div>
      </div>

      {liveQueue && (
        <div className="mt-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5">
          <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Live Queue</h4>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 p-3"><p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{liveQueue.waiting}</p><p className="text-[10px] text-zinc-500">Waiting</p></div>
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-500/10 p-3"><p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{liveQueue.currentToken != null ? `Q${liveQueue.currentToken}` : '—'}</p><p className="text-[10px] text-zinc-500">Serving</p></div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-3"><p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{liveQueue.estimatedWait}m</p><p className="text-[10px] text-zinc-500">Est. Wait</p></div>
          </div>
        </div>
      )}

      {(profile.services?.length > 0) && (
        <div className="mt-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5">
          <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Services</h4>
          <div className="space-y-2">
            {profile.services.map((s) => (
              <div key={String(s._id)} className="flex items-center justify-between py-2 border-b border-zinc-50 dark:border-zinc-800/50 last:border-0">
                <span className={`text-sm font-medium ${s.isAvailable ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400 line-through'}`}>{s.name}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">₹{Number(s.price) || 0} · {s.duration || 30} min</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(profile.staff?.length > 0) && (
        <div className="mt-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5">
          <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Our Team</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {profile.staff.map((m) => (
              <div key={String(m._id)} className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                  {String(m.name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{m.name}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{m.role || 'Professional'}{m.isActive ? '' : ' · Off'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(profile.openingHours?.length > 0) && (
        <div className="mt-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5">
          <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Opening Hours</h4>
          <div className="space-y-1.5">
            {profile.openingHours.map((h) => (
              <div key={String(h.day)} className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400 capitalize">{String(h.day).slice(0, 3)}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{h.closed ? 'Closed' : `${h.open} – ${h.close}`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(payments.requirePayment || payments.upiId) && (
        <div className="mt-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5">
          <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Payments</h4>
          <div className="space-y-1.5 text-sm">
            {payments.requirePayment && (
              <p className="text-zinc-600 dark:text-zinc-400">Advance of ₹{Number(payments.advanceAmount) || 0} required on booking</p>
            )}
            <p className="text-zinc-600 dark:text-zinc-400 capitalize">Mode: {String(payments.paymentMode || 'both').replace('_', ' ')}</p>
            {payments.upiId && <p className="text-zinc-600 dark:text-zinc-400">UPI: {payments.upiId}</p>}
          </div>
        </div>
      )}

      <div className="mt-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 flex items-center gap-5">
        <div className="p-3 bg-white rounded-2xl border border-zinc-200 dark:border-zinc-700">
          <QRCodeCanvas value={`${typeof window !== 'undefined' ? window.location.origin : ''}/b/${profile._id}`} size={96} level="M" bgColor="#ffffff" fgColor="#0f172a" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Business QR Code</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Scan to open your public business page at{' '}
            <span className="font-mono">/b/{profile._id}</span>
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 text-xs text-zinc-400">
        <HiOutlineArrowRight className="w-3.5 h-3.5" />
        Customers will see this page at <span className="font-mono">/b/{profile._id}</span>
      </div>
    </div>
  );
}
