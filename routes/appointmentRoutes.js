const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateAppointment, handleValidationErrors } = require('../middleware/validationMiddleware');

// All appointment routes require authentication
router.use(requireAuth);

// Booking routes
router.get('/book', appointmentController.showBooking);
router.post('/book', validateAppointment, handleValidationErrors, appointmentController.bookAppointment);

// Appointment management routes
router.get('/:id', appointmentController.showAppointment);
router.put('/:id/cancel', appointmentController.cancelAppointment);
router.put('/:id/reschedule', appointmentController.rescheduleAppointment);

// API routes
router.get('/api/available-slots', appointmentController.getAvailableSlots);

module.exports = router;