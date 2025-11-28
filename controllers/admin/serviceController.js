const { Service, Appointment } = require('../../models');

const serviceController = {
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

    // API routes for service management
    getServicesApi: async (req, res) => {
        try {
            const services = await Service.findAll({
                order: [['name', 'ASC']]
            });
            res.json({ success: true, data: services });
        } catch (error) {
            console.error('Get services API error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch services' });
        }
    }
};

module.exports = serviceController;
