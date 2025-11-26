const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegistration, validateLogin, handleValidationErrors } = require('../middleware/validationMiddleware');
const { redirectIfAuthenticated } = require('../middleware/authMiddleware');

// Customer authentication routes
router.get('/login', redirectIfAuthenticated, authController.showLogin);
router.post('/login', validateLogin, handleValidationErrors, authController.login);

router.get('/register', redirectIfAuthenticated, authController.showRegister);
router.post('/register', validateRegistration, handleValidationErrors, authController.register);

router.post('/logout', authController.logout);

module.exports = router;