/**
 * QueueBook — Storage abstraction for uploaded images.
 *
 * Current driver: local disk (files stored under <server>/uploads and served
 * at /uploads). To move to Cloudinary/S3 later, implement a new driver behind
 * the same interface and switch via STORAGE_DRIVER env var:
 *
 *   STORAGE_DRIVER=local   (default)
 *   STORAGE_DRIVER=s3      (future)
 *
 * Public contract:
 *   saveUpload({ originalname, mimetype, buffer }) -> { url }
 */

const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.resolve(__dirname, '..', process.env.UPLOADS_DIR || 'uploads');
const PUBLIC_UPLOADS_PATH = process.env.PUBLIC_UPLOADS_URL || '/uploads';

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function sanitizeFilename(name) {
  return String(name || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .slice(-64);
}

function randomHex(len = 12) {
  let out = '';
  const bytes = require('crypto').randomBytes(len);
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
  return out;
}

async function saveUpload(file) {
  ensureUploadsDir();
  const safeName = sanitizeFilename(file.originalname);
  const ext = path.extname(safeName) || '.img';
  const filename = `${Date.now()}-${randomHex()}${ext}`;
  const fullPath = path.join(UPLOADS_DIR, filename);

  if (Buffer.isBuffer(file.buffer)) {
    fs.writeFileSync(fullPath, file.buffer);
  } else if (file.stream) {
    const ws = fs.createWriteStream(fullPath);
    await new Promise((resolve, reject) => {
      file.stream.pipe(ws);
      file.stream.on('end', resolve);
      file.stream.on('error', reject);
    });
  } else {
    throw new Error('Unsupported upload payload');
  }

  const url = `${PUBLIC_UPLOADS_PATH}/${filename}`;
  return { url, filename, path: fullPath };
}

async function deleteUpload(urlOrFilename) {
  try {
    const value = String(urlOrFilename || '');
    const filename = value.split('/').pop();
    const fullPath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(fullPath) && fullPath.startsWith(UPLOADS_DIR)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.warn('deleteUpload error:', err.message);
  }
}

module.exports = { saveUpload, deleteUpload, UPLOADS_DIR, PUBLIC_UPLOADS_PATH };
