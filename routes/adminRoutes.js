const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdminAuth, redirectIfAdminAuthenticated, requireRole, requirePermission } = require('../middleware/authMiddleware');

// Admin authentication routes
router.get('/login', redirectIfAdminAuthenticated, adminController.showAdminLogin);
router.post('/login', adminController.adminLogin);
router.post('/logout', adminController.adminLogout);

// Admin dashboard routes
router.get('/dashboard', requireAdminAuth, adminController.showAdminDashboard);
router.get('/api/dashboard-stats', requireAdminAuth, adminController.getDashboardStats);

// Admin management routes
router.get('/admins', requireAdminAuth, requirePermission('admin_users', 'read'), adminController.showAdmins);

// Customer management routes
router.get('/customers', requireAdminAuth, requirePermission('customers', 'read'), adminController.showCustomers);

// Barber management routes
router.get('/barbers', requireAdminAuth, requirePermission('barbers', 'read'), adminController.showBarbers);

// Service management routes
router.get('/services', requireAdminAuth, requirePermission('services', 'read'), adminController.showServices);

// Appointment management routes
router.get('/appointments', requireAdminAuth, requirePermission('appointments', 'read'), adminController.showAppointments);
router.put('/api/appointments/:id/status', requireAdminAuth, requirePermission('appointments', 'write'), adminController.updateAppointmentStatus);

// Rating management routes
router.get('/ratings', requireAdminAuth, requirePermission('ratings', 'read'), adminController.showRatings);
router.put('/api/ratings/:id/approval', requireAdminAuth, requirePermission('ratings', 'write'), adminController.updateRatingApproval);

// Profile routes
router.get('/profile', requireAdminAuth, adminController.showProfile);
router.put('/api/profile', requireAdminAuth, adminController.updateProfile);

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

// API routes for admin management
router.get('/api/admins', requireAdminAuth, requirePermission('admin_users', 'read'), async (req, res) => {
    try {
        const admins = await AdminUser.findAll({
            attributes: { exclude: ['password'] },
            order: [['created_at', 'DESC']]
        });
        res.json({ success: true, data: admins });
    } catch (error) {
        console.error('Get admins API error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch admins' });
    }
});

router.post('/api/admins', requireAdminAuth, requirePermission('admin_users', 'write'), async (req, res) => {
    try {
        const { username, email, password, first_name, last_name, role, permissions } = req.body;
        
        const existingAdmin = await AdminUser.findOne({
            where: { [Op.or]: [{ username }, { email }] }
        });

        if (existingAdmin) {
            return res.status(400).json({ success: false, error: 'Username or email already exists' });
        }

        const admin = await AdminUser.create({
            username,
            email,
            password,
            first_name,
            last_name,
            role,
            permissions: permissions || [],
            is_active: true
        });

        res.json({ success: true, message: 'Admin created successfully', data: admin });
    } catch (error) {
        console.error('Create admin API error:', error);
        res.status(500).json({ success: false, error: 'Failed to create admin' });
    }
});

router.put('/api/admins/:id', requireAdminAuth, requirePermission('admin_users', 'write'), async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, email, role, permissions, is_active } = req.body;

        const admin = await AdminUser.findByPk(id);
        if (!admin) {
            return res.status(404).json({ success: false, error: 'Admin not found' });
        }

        await admin.update({
            first_name,
            last_name,
            email,
            role,
            permissions: permissions || admin.permissions,
            is_active: is_active !== undefined ? is_active : admin.is_active
        });

        res.json({ success: true, message: 'Admin updated successfully' });
    } catch (error) {
        console.error('Update admin API error:', error);
        res.status(500).json({ success: false, error: 'Failed to update admin' });
    }
});

router.delete('/api/admins/:id', requireAdminAuth, requirePermission('admin_users', 'delete'), async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent self-deletion
        if (parseInt(id) === req.session.admin.id) {
            return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
        }

        const admin = await AdminUser.findByPk(id);
        if (!admin) {
            return res.status(404).json({ success: false, error: 'Admin not found' });
        }

        await admin.destroy();
        res.json({ success: true, message: 'Admin deleted successfully' });
    } catch (error) {
        console.error('Delete admin API error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete admin' });
    }
});

// API routes for customer management
router.get('/api/customers', requireAdminAuth, requirePermission('customers', 'read'), async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        const where = search ? {
            [Op.or]: [
                { first_name: { [Op.like]: `%${search}%` } },
                { last_name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ]
        } : {};

        const { count, rows: customers } = await Customer.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: customers,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalItems: count
            }
        });
    } catch (error) {
        console.error('Get customers API error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch customers' });
    }
});

// API routes for barber management
router.get('/api/barbers', requireAdminAuth, requirePermission('barbers', 'read'), async (req, res) => {
    try {
        const barbers = await Barber.findAll({
            order: [['name', 'ASC']]
        });
        res.json({ success: true, data: barbers });
    } catch (error) {
        console.error('Get barbers API error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch barbers' });
    }
});

// API routes for service management
router.get('/api/services', requireAdminAuth, requirePermission('services', 'read'), async (req, res) => {
    try {
        const services = await Service.findAll({
            order: [['name', 'ASC']]
        });
        res.json({ success: true, data: services });
    } catch (error) {
        console.error('Get services API error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch services' });
    }
});

// API routes for appointment management
router.get('/api/appointments', requireAdminAuth, requirePermission('appointments', 'read'), async (req, res) => {
    try {
        const { status, page = 1, limit = 10, date } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (status && status !== 'all') where.status = status;
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            where.appointment_date = { [Op.between]: [startDate, endDate] };
        }

        const { count, rows: appointments } = await Appointment.findAndCountAll({
            where,
            include: [
                { model: Customer, as: 'customer' },
                { model: Service, as: 'service' },
                { model: Barber, as: 'barber' }
            ],
            order: [['appointment_date', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: appointments,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalItems: count
            }
        });
    } catch (error) {
        console.error('Get appointments API error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch appointments' });
    }
});

// API routes for rating management
router.get('/api/ratings', requireAdminAuth, requirePermission('ratings', 'read'), async (req, res) => {
    try {
        const { approved, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (approved !== undefined) where.is_approved = approved === 'true';

        const { count, rows: ratings } = await Rating.findAndCountAll({
            where,
            include: [
                { model: Customer, as: 'customer' },
                { model: Barber, as: 'barber' },
                { 
                    model: Appointment, 
                    as: 'appointment',
                    include: [{ model: Service, as: 'service' }]
                }
            ],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: ratings,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalItems: count
            }
        });
    } catch (error) {
        console.error('Get ratings API error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch ratings' });
    }
});
router.post('/admins', adminController.createAdmin);
router.put('/admins/:id/status', adminController.updateAdminStatus);
router.delete('/admins/:id', adminController.deleteAdmin);

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
        layout: 'admin-layout',
        admin: req.session.admin
    });
});

module.exports = router;