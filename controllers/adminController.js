const { AdminUser, Appointment, Service, Barber, Customer, Rating, sequelize } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const adminController = {
    // Show admin login form
    showAdminLogin: (req, res) => {
        res.render('admin/admin-login', {
            title: 'Admin Login - Classic Cuts',
            layout: 'admin-layout'
        });
    },

    // Handle admin login
    adminLogin: async (req, res) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                req.flash('error', 'Username and password are required');
                return res.redirect('/admin/login');
            }

            const admin = await AdminUser.findOne({ 
                where: { 
                    [Op.or]: [
                        { username: username.trim() },
                        { email: username.trim() }
                    ],
                    is_active: true 
                } 
            });

            if (!admin) {
                req.flash('error', 'Invalid username or password');
                return res.redirect('/admin/login');
            }

            const isPasswordValid = await admin.checkPassword(password);
            if (!isPasswordValid) {
                req.flash('error', 'Invalid username or password');
                return res.redirect('/admin/login');
            }

            // Update last login
            await admin.update({ last_login: new Date() });

            // Create admin session
            req.session.admin = {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                first_name: admin.first_name,
                last_name: admin.last_name,
                permissions: admin.permissions
            };

            req.flash('success', `Welcome back, ${admin.first_name || admin.username}!`);
            res.redirect('/admin/dashboard');

        } catch (error) {
            console.error('Admin login error:', error);
            req.flash('error', 'Login failed. Please try again.');
            res.redirect('/admin/login');
        }
    },

    // Admin logout
    adminLogout: (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Admin logout error:', err);
                req.flash('error', 'Logout failed');
                return res.redirect('/admin/dashboard');
            }
            res.redirect('/admin/login');
        });
    },

    // Admin dashboard
    showAdminDashboard: async (req, res) => {
        try {
            const today = new Date();
            const startOfToday = new Date(today.setHours(0, 0, 0, 0));
            const endOfToday = new Date(today.setHours(23, 59, 59, 999));
            const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

            // Get today's appointments
            const todaysAppointments = await Appointment.findAll({
                where: {
                    appointment_date: {
                        [Op.between]: [startOfToday, endOfToday]
                    }
                },
                include: [
                    { model: Customer, as: 'customer' },
                    { model: Service, as: 'service' },
                    { model: Barber, as: 'barber' }
                ],
                order: [['appointment_date', 'ASC']]
            });

            // Get statistics
            const totalAppointments = await Appointment.count();
            const pendingAppointments = await Appointment.count({ 
                where: { status: 'pending' } 
            });
            const totalCustomers = await Customer.count();
            const totalBarbers = await Barber.count({ where: { is_active: true } });
            const totalRevenue = await Appointment.sum('total_price', {
                where: { status: 'completed' }
            });

            // Get weekly revenue
            const weeklyRevenue = await Appointment.sum('total_price', {
                where: {
                    status: 'completed',
                    appointment_date: {
                        [Op.gte]: startOfWeek
                    }
                }
            });

            // Get popular services
            const popularServices = await sequelize.query(`
                SELECT s.name, COUNT(a.id) as appointment_count
                FROM services s
                JOIN appointments a ON s.id = a.service_id
                WHERE a.status = 'completed'
                GROUP BY s.id, s.name
                ORDER BY appointment_count DESC
                LIMIT 5
            `, { type: sequelize.QueryTypes.SELECT });

            // Get recent ratings
            const recentRatings = await Rating.findAll({
                include: [
                    { model: Customer, as: 'customer' },
                    { model: Barber, as: 'barber' },
                    { 
                        model: Appointment, 
                        as: 'appointment',
                        include: [{ model: Service, as: 'service' }]
                    }
                ],
                where: { is_approved: true },
                order: [['created_at', 'DESC']],
                limit: 5
            });

            // Calculate pending appointments count for sidebar
            const pendingAppointmentsCount = await Appointment.count({ 
                where: { status: 'pending' } 
            });

            res.render('admin/admin-dashboard', {
                title: 'Admin Dashboard - Classic Cuts',
                layout: 'admin-layout',
                admin: req.session.admin,
                todaysAppointments,
                recentRatings,
                stats: {
                    totalAppointments,
                    pendingAppointments,
                    totalCustomers,
                    totalBarbers,
                    totalRevenue: totalRevenue || 0,
                    weeklyRevenue: weeklyRevenue || 0
                },
                popularServices,
                pendingAppointmentsCount,
                currentPage: 'dashboard',
                moment
            });
        } catch (error) {
            console.error('Admin dashboard error:', error);
            req.flash('error', 'Unable to load dashboard');
            res.redirect('/admin/dashboard');
        }
    },

    // Get dashboard stats API
    getDashboardStats: async (req, res) => {
        try {
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

            // Current month stats
            const currentMonthStats = await Appointment.findAll({
                where: {
                    appointment_date: { [Op.gte]: startOfMonth },
                    status: 'completed'
                },
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('id')), 'appointment_count'],
                    [sequelize.fn('SUM', sequelize.col('total_price')), 'total_revenue']
                ],
                raw: true
            });

            // Last month stats for comparison
            const lastMonthStats = await Appointment.findAll({
                where: {
                    appointment_date: { 
                        [Op.between]: [startOfLastMonth, startOfMonth] 
                    },
                    status: 'completed'
                },
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('id')), 'appointment_count'],
                    [sequelize.fn('SUM', sequelize.col('total_price')), 'total_revenue']
                ],
                raw: true
            });

            // Daily appointments for the last 7 days
            const dailyAppointments = await sequelize.query(`
                SELECT 
                    DATE(appointment_date) as date,
                    COUNT(*) as count,
                    SUM(total_price) as revenue
                FROM appointments 
                WHERE status = 'completed' 
                AND appointment_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                GROUP BY DATE(appointment_date)
                ORDER BY date ASC
            `, { type: sequelize.QueryTypes.SELECT });

            res.json({
                success: true,
                stats: {
                    currentMonth: currentMonthStats[0] || { appointment_count: 0, total_revenue: 0 },
                    lastMonth: lastMonthStats[0] || { appointment_count: 0, total_revenue: 0 },
                    dailyAppointments
                }
            });
        } catch (error) {
            console.error('Get dashboard stats error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
        }
    },

    // Admin Management
    showAdmins: async (req, res) => {
        try {
            const admins = await AdminUser.findAll({
                order: [['created_at', 'DESC']]
            });

            // Calculate pending appointments count for sidebar
            const pendingAppointmentsCount = await Appointment.count({ 
                where: { status: 'pending' } 
            });

            res.render('admin/admins', {
                title: 'Admin Management - Classic Cuts',
                layout: 'admin-layout',
                admin: req.session.admin,
                admins,
                pendingAppointmentsCount,
                currentPage: 'admins'
            });
        } catch (error) {
            console.error('Admin management error:', error);
            req.flash('error', 'Unable to load admin management');
            res.redirect('/admin/dashboard');
        }
    },

    // Customer Management
    showCustomers: async (req, res) => {
        try {
            const { page = 1, search = '' } = req.query;
            const limit = 20;
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
                limit,
                offset
            });

            // Calculate pending appointments count for sidebar
            const pendingAppointmentsCount = await Appointment.count({ 
                where: { status: 'pending' } 
            });

            const totalPages = Math.ceil(count / limit);

            res.render('admin/customers', {
                title: 'Customer Management - Classic Cuts',
                layout: 'admin-layout',
                admin: req.session.admin,
                customers,
                currentPage: parseInt(page),
                totalPages,
                search,
                pendingAppointmentsCount,
                currentPage: 'customers',
                moment
            });
        } catch (error) {
            console.error('Customer management error:', error);
            req.flash('error', 'Unable to load customers');
            res.redirect('/admin/dashboard');
        }
    },

    // Barber Management
    showBarbers: async (req, res) => {
        try {
            const barbers = await Barber.findAll({
                order: [['name', 'ASC']]
            });

            // Calculate pending appointments count for sidebar
            const pendingAppointmentsCount = await Appointment.count({ 
                where: { status: 'pending' } 
            });

            res.render('admin/barbers', {
                title: 'Barber Management - Classic Cuts',
                layout: 'admin-layout',
                admin: req.session.admin,
                barbers,
                pendingAppointmentsCount,
                currentPage: 'barbers',
                moment
            });
        } catch (error) {
            console.error('Barber management error:', error);
            req.flash('error', 'Unable to load barbers');
            res.redirect('/admin/dashboard');
        }
    },

    // Service Management
    showServices: async (req, res) => {
        try {
            const services = await Service.findAll({
                order: [['name', 'ASC']]
            });

            // Calculate pending appointments count for sidebar
            const pendingAppointmentsCount = await Appointment.count({ 
                where: { status: 'pending' } 
            });

            res.render('admin/services', {
                title: 'Service Management - Classic Cuts',
                layout: 'admin-layout',
                admin: req.session.admin,
                services,
                pendingAppointmentsCount,
                currentPage: 'services'
            });
        } catch (error) {
            console.error('Service management error:', error);
            req.flash('error', 'Unable to load services');
            res.redirect('/admin/dashboard');
        }
    },

    // Appointment Management
    showAppointments: async (req, res) => {
        try {
            const { status, page = 1, date } = req.query;
            const limit = 20;
            const offset = (page - 1) * limit;

            const where = {};
            if (status && status !== 'all') where.status = status;
            if (date) {
                const startDate = new Date(date);
                const endDate = new Date(date);
                endDate.setDate(endDate.getDate() + 1);
                where.appointment_date = { [Op.between]: [startDate, endDate] };
            }

            // Get appointments with pagination - MINIMAL COLUMNS ONLY
            const { count, rows: appointments } = await Appointment.findAndCountAll({
                where,
                include: [
                    { 
                        model: Customer, 
                        as: 'customer',
                        attributes: ['id', 'name', 'phone'] // Only use columns that exist
                    },
                    { 
                        model: Service, 
                        as: 'service',
                        attributes: ['id', 'name', 'price', 'duration'] 
                    },
                    { 
                        model: Barber, 
                        as: 'barber',
                        attributes: ['id', 'name'] // Only id and name
                    }
                ],
                order: [['appointment_date', 'DESC']],
                limit,
                offset
            });

            // Get all barbers for the filter dropdown
            const barbers = await Barber.findAll({
                where: { is_active: true },
                order: [['name', 'ASC']],
                attributes: ['id', 'name'] // Only essential columns
            });

            // Get all customers for the new appointment form
            const customers = await Customer.findAll({
                order: [['name', 'ASC']], // Use 'name' instead of 'first_name'
                attributes: ['id', 'name', 'phone'] // Only use existing columns
            });

            // Get all services for the new appointment form
            const services = await Service.findAll({
                where: { is_active: true },
                order: [['name', 'ASC']],
                attributes: ['id', 'name', 'price', 'duration']
            });

            // Calculate pending appointments count for sidebar
            const pendingAppointmentsCount = await Appointment.count({ 
                where: { status: 'pending' } 
            });

            const totalPages = Math.ceil(count / limit);

            res.render('admin/appointments', {
                title: 'Appointment Management - Classic Cuts',
                layout: 'admin-layout',
                admin: req.session.admin,
                appointments,
                barbers,
                customers,
                services,
                pendingAppointmentsCount,
                currentPage: 'appointments',
                currentStatus: status,
                currentDate: date,
                currentPageNum: parseInt(page),
                totalPages,
                moment
            });
        } catch (error) {
            console.error('Appointment management error:', error);
            req.flash('error', 'Unable to load appointments');
            res.redirect('/admin/dashboard');
        }
    },

    // Create new appointment
    createAppointment: async (req, res) => {
        try {
            const { customer_id, service_id, barber_id, appointment_date, appointment_time, status, notes } = req.body;

            // Get service price
            const service = await Service.findByPk(service_id);
            if (!service) {
                return res.status(404).json({ success: false, error: 'Service not found' });
            }

            // Combine date and time
            const appointmentDateTime = new Date(`${appointment_date}T${appointment_time}`);

            const appointment = await Appointment.create({
                customer_id,
                service_id,
                barber_id,
                appointment_date: appointmentDateTime,
                total_price: service.price,
                status: status || 'pending',
                notes: notes || null
            });

            res.json({ 
                success: true, 
                message: 'Appointment created successfully',
                appointment 
            });
        } catch (error) {
            console.error('Create appointment error:', error);
            res.status(500).json({ success: false, error: 'Failed to create appointment' });
        }
    },

    // Get single appointment for editing
    getAppointment: async (req, res) => {
        try {
            const { id } = req.params;

            const appointment = await Appointment.findByPk(id, {
                include: [
                    { model: Customer, as: 'customer' },
                    { model: Service, as: 'service' },
                    { model: Barber, as: 'barber' }
                ]
            });

            if (!appointment) {
                return res.status(404).json({ success: false, error: 'Appointment not found' });
            }

            res.json({ success: true, appointment });
        } catch (error) {
            console.error('Get appointment error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch appointment' });
        }
    },

    // Update appointment
    updateAppointment: async (req, res) => {
        try {
            const { id } = req.params;
            const { customer_id, service_id, barber_id, appointment_date, appointment_time, status, notes } = req.body;

            const appointment = await Appointment.findByPk(id);
            if (!appointment) {
                return res.status(404).json({ success: false, error: 'Appointment not found' });
            }

            // Get service price if service changed
            let total_price = appointment.total_price;
            if (service_id && service_id !== appointment.service_id) {
                const service = await Service.findByPk(service_id);
                if (service) {
                    total_price = service.price;
                }
            }

            // Combine date and time
            let appointmentDateTime = appointment.appointment_date;
            if (appointment_date && appointment_time) {
                appointmentDateTime = new Date(`${appointment_date}T${appointment_time}`);
            }

            await appointment.update({
                customer_id: customer_id || appointment.customer_id,
                service_id: service_id || appointment.service_id,
                barber_id: barber_id || appointment.barber_id,
                appointment_date: appointmentDateTime,
                total_price,
                status: status || appointment.status,
                notes: notes !== undefined ? notes : appointment.notes
            });

            res.json({ 
                success: true, 
                message: 'Appointment updated successfully' 
            });
        } catch (error) {
            console.error('Update appointment error:', error);
            res.status(500).json({ success: false, error: 'Failed to update appointment' });
        }
    },

    // Delete appointment
    deleteAppointment: async (req, res) => {
        try {
            const { id } = req.params;

            const appointment = await Appointment.findByPk(id);
            if (!appointment) {
                return res.status(404).json({ success: false, error: 'Appointment not found' });
            }

            await appointment.destroy();

            res.json({ 
                success: true, 
                message: 'Appointment deleted successfully' 
            });
        } catch (error) {
            console.error('Delete appointment error:', error);
            res.status(500).json({ success: false, error: 'Failed to delete appointment' });
        }
    },

    // Rating Management
    showRatings: async (req, res) => {
        try {
            const { approved, page = 1 } = req.query;
            const limit = 20;
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
                limit,
                offset
            });

            // Calculate pending appointments count for sidebar
            const pendingAppointmentsCount = await Appointment.count({ 
                where: { status: 'pending' } 
            });

            const totalPages = Math.ceil(count / limit);

            res.render('admin/ratings', {
                title: 'Rating Management - Classic Cuts',
                layout: 'admin-layout',
                admin: req.session.admin,
                ratings,
                currentFilter: approved,
                currentPage: parseInt(page),
                totalPages,
                pendingAppointmentsCount,
                currentPage: 'ratings',
                moment
            });
        } catch (error) {
            console.error('Rating management error:', error);
            req.flash('error', 'Unable to load ratings');
            res.redirect('/admin/dashboard');
        }
    },

    // Update Rating Approval Status
    updateRatingApproval: async (req, res) => {
        try {
            const { id } = req.params;
            const { is_approved } = req.body;

            const rating = await Rating.findByPk(id);
            if (!rating) {
                return res.status(404).json({ success: false, error: 'Rating not found' });
            }

            await rating.update({ is_approved: is_approved === 'true' });

            res.json({ 
                success: true, 
                message: `Rating ${is_approved === 'true' ? 'approved' : 'unapproved'} successfully` 
            });
        } catch (error) {
            console.error('Update rating approval error:', error);
            res.status(500).json({ success: false, error: 'Failed to update rating' });
        }
    },

    // Update Appointment Status
    updateAppointmentStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ success: false, error: 'Invalid status' });
            }

            const appointment = await Appointment.findByPk(id);
            if (!appointment) {
                return res.status(404).json({ success: false, error: 'Appointment not found' });
            }

            await appointment.update({ status });

            res.json({ 
                success: true, 
                message: `Appointment ${status} successfully` 
            });
        } catch (error) {
            console.error('Update appointment status error:', error);
            res.status(500).json({ success: false, error: 'Failed to update appointment' });
        }
    },

    // Get Admin Profile
    showProfile: async (req, res) => {
        try {
            const admin = await AdminUser.findByPk(req.session.admin.id);
            if (!admin) {
                req.flash('error', 'Admin not found');
                return res.redirect('/admin/dashboard');
            }

            // Calculate pending appointments count for sidebar
            const pendingAppointmentsCount = await Appointment.count({ 
                where: { status: 'pending' } 
            });

            res.render('admin/profile', {
                title: 'My Profile - Classic Cuts',
                layout: 'admin-layout',
                admin: req.session.admin,
                adminData: admin,
                pendingAppointmentsCount,
                currentPage: 'profile',
                moment  // Added moment here
            });
        } catch (error) {
            console.error('Profile error:', error);
            req.flash('error', 'Unable to load profile');
            res.redirect('/admin/dashboard');
        }
    },

    // Update Admin Profile
    updateProfile: async (req, res) => {
        try {
            const { first_name, last_name, email, current_password, new_password } = req.body;
            const adminId = req.session.admin.id;

            const admin = await AdminUser.findByPk(adminId);
            if (!admin) {
                return res.status(404).json({ success: false, error: 'Admin not found' });
            }

            // Update basic info
            await admin.update({
                first_name,
                last_name,
                email
            });

            // Update password if provided
            if (current_password && new_password) {
                const isCurrentPasswordValid = await admin.checkPassword(current_password);
                if (!isCurrentPasswordValid) {
                    return res.status(400).json({ success: false, error: 'Current password is incorrect' });
                }
                await admin.update({ password: new_password });
            }

            // Update session
            req.session.admin.first_name = first_name;
            req.session.admin.last_name = last_name;
            req.session.admin.email = email;

            res.json({ 
                success: true, 
                message: 'Profile updated successfully' 
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ success: false, error: 'Failed to update profile' });
        }
    },

    // Create new admin
    createAdmin: async (req, res) => {
        try {
            const { first_name, last_name, username, email, password, role, is_active, permissions } = req.body;

            // Check if username or email already exists
            const existingAdmin = await AdminUser.findOne({
                where: {
                    [Op.or]: [
                        { username: username.trim() },
                        { email: email.trim() }
                    ]
                }
            });

            if (existingAdmin) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Username or email already exists' 
                });
            }

            const admin = await AdminUser.create({
                first_name,
                last_name,
                username: username.trim(),
                email: email.trim(),
                password, // This will be hashed by the model hook
                role: role || 'admin',
                is_active: is_active === 'true',
                permissions: permissions || 'dashboard'
            });

            res.json({ 
                success: true, 
                message: 'Administrator created successfully',
                admin: {
                    id: admin.id,
                    first_name: admin.first_name,
                    last_name: admin.last_name,
                    username: admin.username,
                    email: admin.email,
                    role: admin.role,
                    is_active: admin.is_active,
                    permissions: admin.permissions
                }
            });
        } catch (error) {
            console.error('Create admin error:', error);
            res.status(500).json({ success: false, error: 'Failed to create administrator' });
        }
    },

    // Update admin status
    updateAdminStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { is_active } = req.body;

            // Prevent self-deactivation
            if (parseInt(id) === req.session.admin.id) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Cannot modify your own status' 
                });
            }

            const admin = await AdminUser.findByPk(id);
            if (!admin) {
                return res.status(404).json({ success: false, error: 'Administrator not found' });
            }

            await admin.update({ is_active: is_active === 'true' });

            res.json({ 
                success: true, 
                message: `Administrator ${is_active === 'true' ? 'activated' : 'deactivated'} successfully` 
            });
        } catch (error) {
            console.error('Update admin status error:', error);
            res.status(500).json({ success: false, error: 'Failed to update administrator status' });
        }
    },

    // Delete admin
    deleteAdmin: async (req, res) => {
        try {
            const { id } = req.params;

            // Prevent self-deletion
            if (parseInt(id) === req.session.admin.id) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Cannot delete your own account' 
                });
            }

            const admin = await AdminUser.findByPk(id);
            if (!admin) {
                return res.status(404).json({ success: false, error: 'Administrator not found' });
            }

            await admin.destroy();

            res.json({ 
                success: true, 
                message: 'Administrator deleted successfully' 
            });
        } catch (error) {
            console.error('Delete admin error:', error);
            res.status(500).json({ success: false, error: 'Failed to delete administrator' });
        }
    },

    // Reports Management
    showReports: async (req, res) => {
        try {
            // Calculate pending appointments count for sidebar
            const pendingAppointmentsCount = await Appointment.count({ 
                where: { status: 'pending' } 
            });

            res.render('admin/reports', {
                title: 'Reports - Classic Cuts',
                layout: 'admin-layout',
                admin: req.session.admin,
                pendingAppointmentsCount,
                currentPage: 'reports'
            });
        } catch (error) {
            console.error('Reports error:', error);
            req.flash('error', 'Unable to load reports');
            res.redirect('/admin/dashboard');
        }
    }
};

module.exports = adminController;