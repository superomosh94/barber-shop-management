const { AdminUser, Appointment, Service, Barber, Customer, Rating, sequelize } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const adminController = {
    // Show admin login form
    showAdminLogin: (req, res) => {
        res.render('admin/admin-login', {
            title: 'Admin Login - Classic Cuts'
        });
    },

    // Handle admin login
    adminLogin: async (req, res) => {
        try {
            const { username, password } = req.body;

            const admin = await AdminUser.findOne({ 
                where: { 
                    [Op.or]: [
                        { username: username },
                        { email: username }
                    ],
                    is_active: true 
                } 
            });

            if (!admin) {
                req.flash('error', 'Invalid username or password');
                return res.render('admin/admin-login', {
                    title: 'Admin Login - Classic Cuts'
                });
            }

            const isPasswordValid = await admin.checkPassword(password);
            if (!isPasswordValid) {
                req.flash('error', 'Invalid username or password');
                return res.render('admin/admin-login', {
                    title: 'Admin Login - Classic Cuts'
                });
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
            res.render('admin/admin-login', {
                title: 'Admin Login - Classic Cuts'
            });
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

    // Admin dashboard - FIXED with proper aliases
    showAdminDashboard: async (req, res) => {
        try {
            const today = new Date();
            const startOfToday = new Date(today.setHours(0, 0, 0, 0));
            const endOfToday = new Date(today.setHours(23, 59, 59, 999));
            const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

            // Get today's appointments - FIXED with proper aliases
            const todaysAppointments = await Appointment.findAll({
                where: {
                    appointment_date: {
                        [Op.between]: [startOfToday, endOfToday]
                    }
                },
                include: [
                    { 
                        model: Customer, 
                        as: 'customer'  // Add the alias
                    },
                    { 
                        model: Service, 
                        as: 'service'   // Add the alias
                    },
                    { 
                        model: Barber, 
                        as: 'barber'    // Add the alias
                    }
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

            // Get recent ratings - FIXED with proper aliases
            const recentRatings = await Rating.findAll({
                include: [
                    { 
                        model: Customer, 
                        as: 'customer' 
                    },
                    { 
                        model: Barber, 
                        as: 'barber' 
                    },
                    { 
                        model: Appointment, 
                        as: 'appointment',
                        include: [{
                            model: Service,
                            as: 'service'
                        }]
                    }
                ],
                where: { is_approved: true },
                order: [['created_at', 'DESC']],
                limit: 5
            });

            res.render('admin/admin-dashboard', {
                title: 'Admin Dashboard - Classic Cuts',
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
            res.json({ success: false, error: 'Failed to fetch dashboard stats' });
        }
    },

    // Simple placeholder pages to avoid view errors
    showAdmins: async (req, res) => {
        try {
            const admins = await AdminUser.findAll({
                order: [['created_at', 'DESC']]
            });

            res.render('admin/admins', {
                title: 'Admin Management - Classic Cuts',
                admin: req.session.admin,
                admins
            });
        } catch (error) {
            console.error('Admin management error:', error);
            // Fallback to dashboard if view doesn't exist
            req.flash('error', 'Admin management page not available yet');
            res.redirect('/admin/dashboard');
        }
    },

    showCustomers: async (req, res) => {
        try {
            const customers = await Customer.findAll({
                order: [['created_at', 'DESC']],
                limit: 50
            });

            res.render('admin/customers', {
                title: 'Customer Management - Classic Cuts',
                admin: req.session.admin,
                customers
            });
        } catch (error) {
            console.error('Customer management error:', error);
            req.flash('error', 'Customer management page not available yet');
            res.redirect('/admin/dashboard');
        }
    },

    showBarbers: async (req, res) => {
        try {
            const barbers = await Barber.findAll({
                order: [['name', 'ASC']]
            });

            res.render('admin/barbers', {
                title: 'Barber Management - Classic Cuts',
                admin: req.session.admin,
                barbers
            });
        } catch (error) {
            console.error('Barber management error:', error);
            req.flash('error', 'Barber management page not available yet');
            res.redirect('/admin/dashboard');
        }
    },

    showServices: async (req, res) => {
        try {
            const services = await Service.findAll({
                where: { is_active: true },
                order: [['name', 'ASC']]
            });

            res.render('admin/services', {
                title: 'Service Management - Classic Cuts',
                admin: req.session.admin,
                services
            });
        } catch (error) {
            console.error('Service management error:', error);
            req.flash('error', 'Service management page not available yet');
            res.redirect('/admin/dashboard');
        }
    },

    showAppointments: async (req, res) => {
        try {
            const { status } = req.query;
            const where = status ? { status } : {};
            
            const appointments = await Appointment.findAll({
                where,
                include: [
                    { model: Customer, as: 'customer' },
                    { model: Service, as: 'service' },
                    { model: Barber, as: 'barber' }
                ],
                order: [['appointment_date', 'DESC']],
                limit: 50
            });

            res.render('admin/appointments', {
                title: 'Appointment Management - Classic Cuts',
                admin: req.session.admin,
                appointments,
                currentStatus: status
            });
        } catch (error) {
            console.error('Appointment management error:', error);
            req.flash('error', 'Appointment management page not available yet');
            res.redirect('/admin/dashboard');
        }
    },

    showRatings: async (req, res) => {
        try {
            const ratings = await Rating.findAll({
                include: [
                    { model: Customer, as: 'customer' },
                    { model: Barber, as: 'barber' },
                    { 
                        model: Appointment, 
                        as: 'appointment',
                        include: [{ model: Service, as: 'service' }]
                    }
                ],
                order: [['created_at', 'DESC']]
            });

            res.render('admin/ratings', {
                title: 'Rating Management - Classic Cuts',
                admin: req.session.admin,
                ratings
            });
        } catch (error) {
            console.error('Rating management error:', error);
            req.flash('error', 'Rating management page not available yet');
            res.redirect('/admin/dashboard');
        }
    },

    // Simple fallback for other pages
    showPage: (req, res) => {
        const page = req.params.page;
        const titles = {
            'reports': 'Reports',
            'settings': 'Settings',
            'profile': 'Profile'
        };
        
        const title = titles[page] || 'Admin Panel';
        
        req.flash('info', `${title} page is under development`);
        res.redirect('/admin/dashboard');
    }
};

module.exports = adminController;