const { Rating, Appointment, Barber, Customer } = require('../models');

const ratingController = {
    // Show rating form
    showRatingForm: async (req, res) => {
        try {
            const { appointment_id } = req.params;
            const customer_id = req.session.user.id;

            const appointment = await Appointment.findOne({
                where: { 
                    id: appointment_id, 
                    customer_id,
                    status: 'completed'
                },
                include: [
                    { model: Service, as: 'service' },
                    { model: Barber, as: 'barber' }
                ]
            });

            if (!appointment) {
                req.flash('error', 'Appointment not found or not completed');
                return res.redirect('/customer/dashboard');
            }

            // Check if already rated
            const existingRating = await Rating.findOne({
                where: { appointment_id }
            });

            if (existingRating) {
                req.flash('error', 'You have already rated this appointment');
                return res.redirect('/customer/dashboard');
            }

            // Check if rating window is still open
            if (!appointment.canBeRated()) {
                req.flash('error', 'Rating period has expired (7 days after completion)');
                return res.redirect('/customer/dashboard');
            }

            res.render('customer/rate-service', {
                title: 'Rate Your Service - Classic Cuts',
                user: req.session.user,
                appointment
            });
        } catch (error) {
            console.error('Rating form error:', error);
            req.flash('error', 'Unable to load rating form');
            res.redirect('/customer/dashboard');
        }
    },

    // Submit rating
    submitRating: async (req, res) => {
        try {
            const { appointment_id } = req.params;
            const { rating, review } = req.body;
            const customer_id = req.session.user.id;

            const appointment = await Appointment.findOne({
                where: { 
                    id: appointment_id, 
                    customer_id,
                    status: 'completed'
                }
            });

            if (!appointment) {
                req.flash('error', 'Appointment not found or not completed');
                return res.redirect('/customer/dashboard');
            }

            // Check if already rated
            const existingRating = await Rating.findOne({
                where: { appointment_id }
            });

            if (existingRating) {
                req.flash('error', 'You have already rated this appointment');
                return res.redirect('/customer/dashboard');
            }

            // Check if rating window is still open
            if (!appointment.canBeRated()) {
                req.flash('error', 'Rating period has expired (7 days after completion)');
                return res.redirect('/customer/dashboard');
            }

            // Create rating
            await Rating.create({
                appointment_id,
                barber_id: appointment.barber_id,
                customer_id,
                rating: parseInt(rating),
                review: review || null,
                is_approved: true // Auto-approve for now, admin can moderate later
            });

            req.flash('success', 'Thank you for your rating!');
            res.redirect('/customer/dashboard');

        } catch (error) {
            console.error('Submit rating error:', error);
            req.flash('error', 'Failed to submit rating. Please try again.');
            res.redirect(`/ratings/${appointment_id}/rate`);
        }
    },

    // Get barber ratings API
    getBarberRatings: async (req, res) => {
        try {
            const { barber_id } = req.params;

            const ratings = await Rating.findAll({
                where: { 
                    barber_id,
                    is_approved: true
                },
                include: [{
                    model: Customer,
                    as: 'customer',
                    attributes: ['name']
                }],
                order: [['created_at', 'DESC']],
                limit: 10
            });

            // Calculate average
            const averageRating = ratings.length > 0 
                ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
                : '0.0';

            res.json({
                success: true,
                ratings,
                averageRating,
                totalRatings: ratings.length
            });
        } catch (error) {
            console.error('Get barber ratings error:', error);
            res.json({ success: false, error: 'Failed to fetch ratings' });
        }
    }
};

module.exports = ratingController;