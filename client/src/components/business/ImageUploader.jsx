import { useRef, useState } from 'react';
import { HiOutlineArrowUpTray, HiOutlineTrash, HiOutlineArrowPath } from 'react-icons/hi2';
import { uploadAPI, imageUrl } from '../../services/api';

/**
 * Upload button for business images (logo, cover, staff, payment QR).
 * Uploads to POST /api/uploads and reports the resolved image URL via onChange.
 */
export default function ImageUploader({ value, onChange, onRemoved, compact = false }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image is too large. Maximum size is 5 MB.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await uploadAPI.uploadImage(file);
      onChange?.(imageUrl(res.data.url));
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = () => {
    if (value) uploadAPI.deleteImage(value).catch(() => {});
    onChange?.('');
    onRemoved?.();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={`inline-flex items-center gap-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          compact ? 'h-8 px-3' : 'h-10 px-4'
        }`}
      >
        {busy ? (
          <>
            <HiOutlineArrowPath className="w-4 h-4 animate-spin" /> Uploading…
          </>
        ) : (
          <>
            {value ? <HiOutlineArrowPath className="w-4 h-4" /> : <HiOutlineArrowUpTray className="w-4 h-4" />}
            {value ? 'Replace' : 'Upload'}
          </>
        )}
      </button>
      {value && (
        <button
          type="button"
          onClick={handleRemove}
          className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
        >
          <HiOutlineTrash className="w-4 h-4" /> Remove
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {error && <p className="w-full text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
