const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { requireAuth } = require('../middleware/authMiddleware');

// All customer routes require authentication
router.use(requireAuth);

// Customer dashboard and profile routes
router.get('/dashboard', customerController.showDashboard);
router.get('/profile', customerController.showProfile);
router.put('/profile', customerController.updateProfile);
router.get('/appointments', customerController.showAppointmentHistory);
router.get('/change-password', customerController.showChangePassword);
router.put('/change-password', customerController.updatePassword);

module.exports = router;