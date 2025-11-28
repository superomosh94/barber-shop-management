const express = require('express');
const router = express.Router();
const { requireAdminAuth, redirectIfAdminAuthenticated, requireRole, requirePermission } = require('../middleware/authMiddleware');

// Import Controllers
const dashboardController = require('../controllers/admin/dashboardController');
const userController = require('../controllers/admin/userController');
const customerController = require('../controllers/admin/customerController');
const barberController = require('../controllers/admin/barberController');
const serviceController = require('../controllers/admin/serviceController');
const appointmentController = require('../controllers/admin/appointmentController');
const ratingController = require('../controllers/admin/ratingController');

// Admin login routes (public - no auth required)
router.get('/login', redirectIfAdminAuthenticated, userController.showAdminLogin);
router.post('/login', redirectIfAdminAuthenticated, userController.adminLogin);
router.post('/logout', requireAdminAuth, userController.adminLogout);

// Dashboard route - must be first
router.get('/dashboard', requireAdminAuth, dashboardController.showAdminDashboard);
router.get('/api/dashboard/stats', requireAdminAuth, dashboardController.getDashboardStats);

// Admin management routes
router.get('/admins', requireAdminAuth, requirePermission('admin_users', 'read'), userController.showAdmins);
router.get('/api/admins', requireAdminAuth, requirePermission('admin_users', 'read'), async (req, res) => {
    try {
        const { AdminUser } = require('../models');
        const admins = await AdminUser.findAll({
            attributes: { exclude: ['password'] },
            order: [['created_at', 'DESC']]
        });
        res.json({ success: true, data: admins });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch admins' });
    }
});
router.post('/api/admins', requireAdminAuth, requirePermission('admin_users', 'write'), userController.createAdmin);
router.put('/api/admins/:id', requireAdminAuth, requirePermission('admin_users', 'write'), async (req, res) => {
    try {
        const { AdminUser } = require('../models');
        const { id } = req.params;
        const { first_name, last_name, email, role, permissions, is_active } = req.body;
        const admin = await AdminUser.findByPk(id);
        if (!admin) return res.status(404).json({ success: false, error: 'Admin not found' });
        await admin.update({ first_name, last_name, email, role, permissions: permissions || admin.permissions, is_active: is_active !== undefined ? is_active : admin.is_active });
        res.json({ success: true, message: 'Admin updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update admin' });
    }
});
router.delete('/api/admins/:id', requireAdminAuth, requirePermission('admin_users', 'delete'), userController.deleteAdmin);

// Customer management routes
router.get('/customers', requireAdminAuth, requirePermission('customers', 'read'), customerController.showCustomers);
router.get('/api/customers', requireAdminAuth, requirePermission('customers', 'read'), customerController.getCustomersApi);

// Barber management routes
router.get('/barbers', requireAdminAuth, requirePermission('barbers', 'read'), barberController.showBarbers);
router.get('/api/barbers', requireAdminAuth, requirePermission('barbers', 'read'), barberController.getBarbersApi);

// Service management routes
router.get('/services', requireAdminAuth, requirePermission('services', 'read'), serviceController.showServices);
router.get('/api/services', requireAdminAuth, requirePermission('services', 'read'), serviceController.getServicesApi);

// Appointment management routes
router.get('/appointments', requireAdminAuth, requirePermission('appointments', 'read'), appointmentController.showAppointments);
router.get('/api/appointments', requireAdminAuth, requirePermission('appointments', 'read'), appointmentController.getAppointmentsApi);
router.put('/api/appointments/:id/status', requireAdminAuth, requirePermission('appointments', 'write'), appointmentController.updateAppointmentStatus);
router.post('/api/appointments', requireAdminAuth, requirePermission('appointments', 'write'), appointmentController.createAppointment);
router.get('/api/appointments/:id', requireAdminAuth, requirePermission('appointments', 'read'), appointmentController.getAppointment);
router.put('/api/appointments/:id', requireAdminAuth, requirePermission('appointments', 'write'), appointmentController.updateAppointment);
router.delete('/api/appointments/:id', requireAdminAuth, requirePermission('appointments', 'delete'), appointmentController.deleteAppointment);

// Rating management routes
router.get('/ratings', requireAdminAuth, requirePermission('ratings', 'read'), ratingController.showRatings);
router.get('/api/ratings', requireAdminAuth, requirePermission('ratings', 'read'), ratingController.getRatingsApi);
router.put('/api/ratings/:id/approval', requireAdminAuth, requirePermission('ratings', 'write'), ratingController.updateRatingApproval);

// Profile routes
router.get('/profile', requireAdminAuth, userController.showProfile);
router.put('/api/profile', requireAdminAuth, userController.updateProfile);

// Reports routes
router.get('/reports', requireAdminAuth, requirePermission('reports', 'read'), (req, res) => {
    res.render('admin/reports', {
        title: 'Reports - Classic Cuts',
        layout: 'admin-layout',
        admin: req.session.admin
    });
});

// Settings routes
router.get('/settings', requireAdminAuth, requirePermission('settings', 'read'), (req, res) => {
    res.render('admin/settings', {
        title: 'Settings - Classic Cuts',
        layout: 'admin-layout',
        admin: req.session.admin
    });
});

module.exports = router;