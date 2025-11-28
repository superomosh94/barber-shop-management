const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { requireAuth } = require('../middleware/authMiddleware');

// All customer routes require authentication
router.use(requireAuth);

// Customer dashboard and profile routes
router.get('/dashboard', customerController.showDashboard);
router.get('/profile', customerController.showProfile);
router.post('/profile', customerController.updateProfile);

// Appointment routes
router.get('/book-appointment', customerController.showBookingPage);
router.get('/appointment-history', customerController.showAppointmentHistory);
router.post('/appointments/:id/cancel', customerController.cancelAppointment);

// Password routes
router.get('/change-password', customerController.showChangePassword);
router.post('/change-password', customerController.updatePassword);

module.exports = router;