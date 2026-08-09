const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// --- Security note ---
// multer's `file.mimetype` is taken verbatim from the client-supplied
// `Content-Type` header of the multipart part — an attacker fully controls it
// and can label a malicious file (e.g. an .html file with an embedded
// <script>) as "image/jpeg". Trusting it (or the client-supplied filename
// extension) would let that file be written to /uploads and served back
// statically, executing in our own origin (stored XSS) the moment anyone
// opens the link.
//
// To close that gap we:
//   1. Buffer the upload in memory (never trust the client's extension by
//      writing directly to disk with it).
//   2. Sniff the real file type from its magic bytes.
//   3. Only write to disk — with an extension WE choose from the sniffed
//      type — once the content itself matches an allowed type.

const storage = multer.memoryStorage();

// Fast first-pass rejection based on the declared header (defense in depth —
// the binding check is the magic-byte sniff in validateAndSaveFile below).
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('סוג הקובץ אינו נתמך. מותר להעלות תמונות (JPG, PNG, WEBP) או קבצי PDF.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Magic-byte signatures for every type we allow. Detection is based purely
// on the file's actual bytes, never on filename or client-supplied headers.
function detectFileType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { ext: '.jpg', mimetype: 'image/jpeg' };
  }
  if (buffer.length >= 8 &&
      buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
      buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A) {
    return { ext: '.png', mimetype: 'image/png' };
  }
  if (buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP') {
    return { ext: '.webp', mimetype: 'image/webp' };
  }
  if (buffer.length >= 6 &&
      (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a')) {
    return { ext: '.gif', mimetype: 'image/gif' };
  }
  if (buffer.length >= 5 && buffer.toString('ascii', 0, 5) === '%PDF-') {
    return { ext: '.pdf', mimetype: 'application/pdf' };
  }
  return null;
}

// Runs after upload.single('file'). Validates the real file content and
// writes it to disk ourselves with a server-generated name + extension.
function validateAndSaveFile(req, res, next) {
  if (!req.file) return next();

  const detected = detectFileType(req.file.buffer);
  if (!detected) {
    return res.status(400).json({ message: 'תוכן הקובץ אינו תואם לסוג תמונה/PDF נתמך. נא להעלות קובץ JPG, PNG, WEBP, GIF או PDF תקין.' });
  }

  const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
  const filename = `media-${uniqueSuffix}${detected.ext}`;
  const destPath = path.join(uploadDir, filename);

  try {
    fs.writeFileSync(destPath, req.file.buffer);
  } catch (err) {
    console.error('Error writing uploaded file to disk:', err.message);
    return res.status(500).json({ message: 'שגיאה בשמירת הקובץ שהועלה.' });
  }

  // Overwrite with server-verified values so downstream controller code
  // never sees the client-supplied filename/mimetype.
  req.file.filename = filename;
  req.file.path = destPath;
  req.file.mimetype = detected.mimetype;

  next();
}

module.exports = upload;
module.exports.validateAndSaveFile = validateAndSaveFile;
