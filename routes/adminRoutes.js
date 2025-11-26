const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdminAuth, redirectIfAdminAuthenticated, requireRole, requirePermission } = require('../middleware/authMiddleware');

// Admin authentication routes
router.get('/login', redirectIfAdminAuthenticated, adminController.showAdminLogin);
router.post('/login', adminController.adminLogin);
router.post('/logout', adminController.adminLogout);

// Admin dashboard routes (require admin authentication)
router.get('/dashboard', requireAdminAuth, adminController.showAdminDashboard);
router.get('/api/dashboard-stats', requireAdminAuth, adminController.getDashboardStats);

// Admin management routes
router.get('/admins', requireAdminAuth, requirePermission('admin_users', 'read'), (req, res) => {
    res.render('admin/admins', {
        title: 'Admin Management - Classic Cuts',
        admin: req.session.admin
    });
});

// Customer management routes
router.get('/customers', requireAdminAuth, requirePermission('customers', 'read'), (req, res) => {
    res.render('admin/customers', {
        title: 'Customer Management - Classic Cuts',
        admin: req.session.admin
    });
});

// Barber management routes
router.get('/barbers', requireAdminAuth, requirePermission('barbers', 'read'), (req, res) => {
    res.render('admin/barbers', {
        title: 'Barber Management - Classic Cuts',
        admin: req.session.admin
    });
});

// Service management routes
router.get('/services', requireAdminAuth, requirePermission('services', 'read'), (req, res) => {
    res.render('admin/services', {
        title: 'Service Management - Classic Cuts',
        admin: req.session.admin
    });
});

// Appointment management routes
router.get('/appointments', requireAdminAuth, requirePermission('appointments', 'read'), (req, res) => {
    res.render('admin/appointments', {
        title: 'Appointment Management - Classic Cuts',
        admin: req.session.admin
    });
});

// Rating management routes
router.get('/ratings', requireAdminAuth, requirePermission('ratings', 'read'), (req, res) => {
    res.render('admin/ratings', {
        title: 'Rating Management - Classic Cuts',
        admin: req.session.admin
    });
});

// Reports routes
router.get('/reports', requireAdminAuth, requirePermission('reports', 'read'), (req, res) => {
    res.render('admin/reports', {
        title: 'Reports - Classic Cuts',
        admin: req.session.admin
    });
});

// Settings routes
router.get('/settings', requireAdminAuth, requirePermission('settings', 'read'), (req, res) => {
    res.render('admin/settings', {
        title: 'Settings - Classic Cuts',
        admin: req.session.admin
    });
});

// Profile routes
router.get('/profile', requireAdminAuth, (req, res) => {
    res.render('admin/profile', {
        title: 'My Profile - Classic Cuts',
        admin: req.session.admin
    });
});

// API routes for admin management
router.get('/api/admins', requireAdminAuth, requirePermission('admin_users', 'read'), (req, res) => {
    // Return admin users data
    res.json({ success: true, data: [] });
});

router.post('/api/admins', requireAdminAuth, requirePermission('admin_users', 'write'), (req, res) => {
    // Create new admin
    res.json({ success: true, message: 'Admin created successfully' });
});

router.put('/api/admins/:id', requireAdminAuth, requirePermission('admin_users', 'write'), (req, res) => {
    // Update admin
    res.json({ success: true, message: 'Admin updated successfully' });
});

router.delete('/api/admins/:id', requireAdminAuth, requirePermission('admin_users', 'delete'), (req, res) => {
    // Delete admin
    res.json({ success: true, message: 'Admin deleted successfully' });
});

// API routes for customer management
router.get('/api/customers', requireAdminAuth, requirePermission('customers', 'read'), (req, res) => {
    // Return customers data
    res.json({ success: true, data: [] });
});

// API routes for barber management
router.get('/api/barbers', requireAdminAuth, requirePermission('barbers', 'read'), (req, res) => {
    // Return barbers data
    res.json({ success: true, data: [] });
});

// API routes for service management
router.get('/api/services', requireAdminAuth, requirePermission('services', 'read'), (req, res) => {
    // Return services data
    res.json({ success: true, data: [] });
});

// API routes for appointment management
router.get('/api/appointments', requireAdminAuth, requirePermission('appointments', 'read'), (req, res) => {
    // Return appointments data
    res.json({ success: true, data: [] });
});

router.put('/api/appointments/:id/status', requireAdminAuth, requirePermission('appointments', 'write'), (req, res) => {
    // Update appointment status
    res.json({ success: true, message: 'Appointment status updated' });
});

// API routes for rating management
router.get('/api/ratings', requireAdminAuth, requirePermission('ratings', 'read'), (req, res) => {
    // Return ratings data
    res.json({ success: true, data: [] });
});

router.put('/api/ratings/:id/approval', requireAdminAuth, requirePermission('ratings', 'write'), (req, res) => {
    // Update rating approval status
    res.json({ success: true, message: 'Rating approval status updated' });
});

// Debug route to check session (remove in production)
router.get('/debug-session', (req, res) => {
    console.log('🔍 Admin Session Debug:', {
        adminSession: req.session.admin,
        userSession: req.session.user,
        sessionId: req.sessionID
    });
    res.json({
        admin: req.session.admin,
        user: req.session.user,
        sessionId: req.sessionID
    });
});

// Catch-all route for admin pages
router.get('*', requireAdminAuth, (req, res) => {
    res.render('admin/404', {
        title: 'Page Not Found - Classic Cuts',
        admin: req.session.admin
    });
});

module.exports = router;