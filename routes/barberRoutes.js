const express = require('express');
const router = express.Router();
const barberController = require('../controllers/barberController');

// Public routes
router.get('/', barberController.showBarbers);
router.get('/:id', barberController.showBarber);

// API routes
router.get('/api/list', barberController.getBarbers);
router.get('/api/:barber_id/ratings', barberController.getBarberRatings); // Fixed this line

module.exports = router;