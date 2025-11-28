const { Appointment, Customer, Service, Barber, Rating, sequelize } = require('../../models');
const { Op } = require('sequelize');
const moment = require('moment');

const dashboardController = {
    // Admin dashboard
    showAdminDashboard: async (req, res) => {
        try {
            const today = new Date();
            const startOfToday = new Date(today.setHours(0, 0, 0, 0));
            const endOfToday = new Date(today.setHours(23, 59, 59, 999));
            const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

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

            res.render('admin/dashboard', {
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
    }
};

module.exports = dashboardController;
