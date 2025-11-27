const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { requireAuth } = require('../middleware/authMiddleware');

// All customer routes require authentication
router.use(requireAuth);

// Customer dashboard and profile routes
router.get('/dashboard', customerController.showDashboard);
router.get('/profile', customerController.showProfile);
router.post('/profile', customerController.updateProfile); // Changed from PUT to POST

// Appointment routes
router.get('/appointment-history', customerController.showAppointmentHistory);
router.post('/appointments/:id/cancel', customerController.cancelAppointment);

// Password routes
router.get('/change-password', customerController.showChangePassword);
router.post('/change-password', customerController.updatePassword); // Changed from PUT to POST

module.exports = router;