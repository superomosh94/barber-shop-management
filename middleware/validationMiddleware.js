const { body, validationResult } = require('express-validator');
const { Customer, AdminUser } = require('../models');

// Customer registration validation
const validateRegistration = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .escape(),
    
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail()
        .custom(async (email) => {
            const existingCustomer = await Customer.findOne({ where: { email } });
            if (existingCustomer) {
                throw new Error('Email already registered');
            }
            return true;
        }),
    
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        }),
    
    body('phone')
        .optional()
        .isMobilePhone()
        .withMessage('Please provide a valid phone number')
];

// Customer login validation
const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// Admin login validation
const validateAdminLogin = [
    body('username')
        .notEmpty()
        .withMessage('Username is required')
        .trim()
        .escape(),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// Appointment booking validation
const validateAppointment = [
    body('service_id')
        .isInt({ min: 1 })
        .withMessage('Please select a valid service'),
    
    body('barber_id')
        .isInt({ min: 1 })
        .withMessage('Please select a valid barber'),
    
    body('appointment_date')
        .isISO8601()
        .withMessage('Please provide a valid appointment date')
        .custom((value) => {
            const appointmentDate = new Date(value);
            const now = new Date();
            
            if (appointmentDate < now) {
                throw new Error('Appointment date must be in the future');
            }
            
            // Check if it's within business hours (9 AM - 7 PM)
            const hour = appointmentDate.getHours();
            if (hour < 9 || hour >= 19) {
                throw new Error('Appointments can only be booked between 9:00 AM and 7:00 PM');
            }
            
            return true;
        }),
    
    body('notes')
        .optional()
        .trim()
        .escape()
        .isLength({ max: 500 })
        .withMessage('Notes cannot exceed 500 characters')
];

// Rating validation
const validateRating = [
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    
    body('review')
        .optional()
        .trim()
        .escape()
        .isLength({ max: 1000 })
        .withMessage('Review cannot exceed 1000 characters')
];

// Service validation
const validateService = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Service name must be between 2 and 100 characters')
        .escape(),
    
    body('description')
        .optional()
        .trim()
        .escape(),
    
    body('price')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    
    body('duration')
        .isInt({ min: 15, max: 180 })
        .withMessage('Duration must be between 15 and 180 minutes'),
    
    body('category')
        .isIn(['haircut', 'shave', 'styling', 'coloring', 'treatment', 'other'])
        .withMessage('Please select a valid category')
];

// Barber validation
const validateBarber = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Barber name must be between 2 and 100 characters')
        .escape(),
    
    body('specialty')
        .optional()
        .trim()
        .escape(),
    
    body('bio')
        .optional()
        .trim()
        .escape(),
    
    body('email')
        .optional()
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    body('phone')
        .optional()
        .isMobilePhone()
        .withMessage('Please provide a valid phone number'),
    
    body('experience')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Experience must be a positive number')
];

// Check validation results
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);
        
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            // API request
            return res.status(422).json({
                success: false,
                errors: errorMessages
            });
        } else {
            // Web request
            req.flash('error', errorMessages);
            return res.redirect('back');
        }
    }
    
    next();
};

module.exports = {
    validateRegistration,
    validateLogin,
    validateAdminLogin,
    validateAppointment,
    validateRating,
    validateService,
    validateBarber,
    handleValidationErrors
};