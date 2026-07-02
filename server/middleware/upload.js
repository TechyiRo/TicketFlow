const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Check if Cloudinary credentials are set and are not the placeholders
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
  process.env.CLOUDINARY_API_SECRET && 
  process.env.CLOUDINARY_API_SECRET !== 'your_api_secret';

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary storage successfully initialized.');
} else {
  console.warn('Cloudinary not configured or using placeholders. Falling back to local data URL generation for uploads.');
}

// Multer memory storage (keeps file in memory before processing)
const storage = multer.memoryStorage();

// File filter to restrict uploads to images, PDFs, and common documents
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ];
  const isValid = allowedTypes.some(type => file.mimetype.startsWith(type) || file.mimetype === type);
  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, docx, xlsx, txt, and zip files are allowed!'), false);
  }
};

// Multer middleware instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

/**
 * Upload a file buffer to Cloudinary, or fallback to returning a base64 Data URI
 * @param {Object} file - The multer file object
 * @param {string} folder - Target folder in Cloudinary
 * @returns {Promise<string>} The uploaded image URL or Data URI
 * @returns {Promise<string>} The uploaded file URL or Data URI
 */
const uploadToCloudinary = (file, folder = 'ticketflow') => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return resolve('');
    }

    if (!isCloudinaryConfigured) {
      // Fallback: Generate base64 Data URL
      const base64Data = file.buffer.toString('base64');
      const dataUrl = `data:${file.mimetype};base64,${base64Data}`;
      return resolve(dataUrl);
    }

    // Upload using Cloudinary stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          // In case of cloud error, fallback to Data URI to keep app functional
          const base64Data = file.buffer.toString('base64');
          const dataUrl = `data:${file.mimetype};base64,${base64Data}`;
          return resolve(dataUrl);
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(file.buffer);
  });
};

module.exports = {
  upload,
  uploadToCloudinary,
};
