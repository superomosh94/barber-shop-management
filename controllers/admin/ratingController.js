const { Rating, Customer, Barber, Appointment, Service } = require('../../models');
const moment = require('moment');

const ratingController = {
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

    // API routes for rating management
    getRatingsApi: async (req, res) => {
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
    }
};

module.exports = ratingController;
