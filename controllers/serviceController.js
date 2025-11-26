const { Service, Appointment, sequelize } = require('../models');
const { Op } = require('sequelize');

const serviceController = {
    // Show all services
    showServices: async (req, res) => {
        try {
            const services = await Service.findAll({
                where: { is_active: true },
                order: [['category', 'ASC'], ['price', 'ASC']]
            });

            // Group services by category
            const servicesByCategory = services.reduce((acc, service) => {
                const category = service.category;
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(service);
                return acc;
            }, {});

            res.render('customer/services', {
                title: 'Our Services - Classic Cuts',
                user: req.session.user,
                servicesByCategory
            });
        } catch (error) {
            console.error('Services page error:', error);
            req.flash('error', 'Unable to load services');
            res.redirect('/');
        }
    },

    // Show service details
    showService: async (req, res) => {
        try {
            const { id } = req.params;

            const service = await Service.findByPk(id);

            if (!service) {
                req.flash('error', 'Service not found');
                return res.redirect('/services');
            }

            // Get popular barbers for this service (based on appointment count)
            const popularBarbers = await sequelize.query(`
                SELECT b.*, COUNT(a.id) as appointment_count
                FROM barbers b
                JOIN appointments a ON b.id = a.barber_id
                WHERE a.service_id = ? AND a.status = 'completed'
                GROUP BY b.id
                ORDER BY appointment_count DESC
                LIMIT 3
            `, {
                replacements: [id],
                type: sequelize.QueryTypes.SELECT
            });

            res.render('customer/service-details', {
                title: `${service.name} - Classic Cuts`,
                user: req.session.user,
                service,
                popularBarbers
            });
        } catch (error) {
            console.error('Service details error:', error);
            req.flash('error', 'Unable to load service details');
            res.redirect('/services');
        }
    },

    // Get services API endpoint
    getServices: async (req, res) => {
        try {
            const services = await Service.findAll({
                where: { is_active: true },
                attributes: ['id', 'name', 'description', 'price', 'duration', 'category'],
                order: [['name', 'ASC']]
            });

            res.json({ success: true, services });
        } catch (error) {
            console.error('Get services error:', error);
            res.json({ success: false, error: 'Failed to fetch services' });
        }
    }
};

module.exports = serviceController;