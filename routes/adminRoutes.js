const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdminAuth, redirectIfAdminAuthenticated } = require('../middleware/authMiddleware');

// Admin authentication routes
router.get('/login', redirectIfAdminAuthenticated, adminController.showAdminLogin);
router.post('/login', adminController.adminLogin);
router.post('/logout', adminController.adminLogout);

// Admin dashboard routes (require admin authentication)
router.use(requireAdminAuth);

router.get('/dashboard', adminController.showAdminDashboard);
router.get('/api/dashboard-stats', adminController.getDashboardStats);

module.exports = router;