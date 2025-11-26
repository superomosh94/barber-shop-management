const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { requireAuth } = require('../middleware/authMiddleware');
const { validateRating, handleValidationErrors } = require('../middleware/validationMiddleware');

// All rating routes require authentication
router.use(requireAuth);

// Rating routes
router.get('/:appointment_id/rate', ratingController.showRatingForm);
router.post('/:appointment_id/rate', validateRating, handleValidationErrors, ratingController.submitRating);

// API routes - REMOVE THIS LINE as it's already in barberRoutes
// router.get('/api/barber/:barber_id', ratingController.getBarberRatings);

module.exports = router;