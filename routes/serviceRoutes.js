const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

// Public routes
router.get('/', serviceController.showServices);
router.get('/:id', serviceController.showService);

// API routes
router.get('/api/list', serviceController.getServices);

module.exports = router;