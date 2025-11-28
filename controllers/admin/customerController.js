const { Customer, Appointment } = require('../../models');
const { Op } = require('sequelize');
const moment = require('moment');

const customerController = {
    // Customer Management
    showCustomers: async (req, res) => {
        try {
            const { page = 1, search = '' } = req.query;
            const limit = 20;
            const offset = (page - 1) * limit;

            const where = search ? {
                [Op.or]: [
                    { name: { [Op.like]: `%${search}%` } }, // Changed from first_name/last_name to name
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

    // API routes for customer management
    getCustomersApi: async (req, res) => {
        try {
            const { page = 1, limit = 10, search = '' } = req.query;
            const offset = (page - 1) * limit;

            const where = search ? {
                [Op.or]: [
                    { name: { [Op.like]: `%${search}%` } },
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
    }
};

module.exports = customerController;
