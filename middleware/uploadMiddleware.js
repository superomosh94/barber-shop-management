const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = 'public/uploads/';
        
        if (file.fieldname === 'barberImage') {
            uploadPath += 'barbers/';
        } else if (file.fieldname === 'serviceImage') {
            uploadPath += 'services/';
        } else if (file.fieldname === 'avatar') {
            uploadPath += 'avatars/';
        }
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Create multer instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// Specific upload configurations
const uploadMiddleware = {
    barber: upload.single('barberImage'),
    service: upload.single('serviceImage'),
    avatar: upload.single('avatar'),
    multiple: upload.array('images', 5)
};

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            req.flash('error', 'File too large. Maximum size is 5MB.');
        } else if (err.code === 'LIMIT_FILE_COUNT') {
            req.flash('error', 'Too many files.');
        } else {
            req.flash('error', 'File upload error.');
        }
    } else if (err) {
        req.flash('error', err.message);
    }
    next();
};

module.exports = { uploadMiddleware, handleUploadError };