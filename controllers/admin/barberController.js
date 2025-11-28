const { Barber, Appointment } = require('../../models');
const moment = require('moment');

const barberController = {
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

    // API routes for barber management
    getBarbersApi: async (req, res) => {
        try {
            const barbers = await Barber.findAll({
                order: [['name', 'ASC']]
            });
            res.json({ success: true, data: barbers });
        } catch (error) {
            console.error('Get barbers API error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch barbers' });
        }
    }
};

module.exports = barberController;
