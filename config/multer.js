const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = [
    'public/uploads/barbers',
    'public/uploads/services',
    'public/uploads/avatars'
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
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
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Multer configuration
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Specific upload configurations
const uploadConfig = {
    barber: upload.single('barberImage'),
    service: upload.single('serviceImage'),
    avatar: upload.single('avatar'),
    multiple: upload.array('images', 5) // Max 5 files
};

module.exports = uploadConfig;