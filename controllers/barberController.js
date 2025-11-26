const { Barber, Rating, Appointment, Service, sequelize } = require('../models');
const { Op } = require('sequelize');

const barberController = {
    // Show all barbers
    showBarbers: async (req, res) => {
        try {
            const barbers = await Barber.findAll({
                where: { is_active: true },
                include: [{
                    model: Rating,
                    as: 'ratings',
                    attributes: ['rating']
                }],
                order: [['name', 'ASC']]
            });

            // Calculate average ratings
            const barbersWithRatings = await Promise.all(
                barbers.map(async (barber) => {
                    const ratings = barber.ratings.map(r => r.rating);
                    const averageRating = ratings.length > 0 
                        ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)
                        : '0.0';
                    
                    return {
                        ...barber.toJSON(),
                        averageRating,
                        totalRatings: ratings.length
                    };
                })
            );

            res.render('customer/barbers', {
                title: 'Our Barbers - Classic Cuts',
                user: req.session.user,
                barbers: barbersWithRatings
            });
        } catch (error) {
            console.error('Barbers page error:', error);
            req.flash('error', 'Unable to load barbers');
            res.redirect('/');
        }
    },

    // Show barber details
    showBarber: async (req, res) => {
        try {
            const { id } = req.params;

            const barber = await Barber.findByPk(id, {
                include: [{
                    model: Rating,
                    as: 'ratings',
                    include: [{
                        model: Customer,
                        as: 'customer',
                        attributes: ['name']
                    }],
                    where: { is_approved: true },
                    required: false,
                    order: [['created_at', 'DESC']]
                }]
            });

            if (!barber) {
                req.flash('error', 'Barber not found');
                return res.redirect('/barbers');
            }

            // Calculate average rating
            const ratings = barber.ratings.map(r => r.rating);
            const averageRating = ratings.length > 0 
                ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)
                : '0.0';
            
            // Get barber's specialties (services they frequently perform)
            const popularServices = await sequelize.query(`
                SELECT s.*, COUNT(a.id) as service_count
                FROM services s
                JOIN appointments a ON s.id = a.service_id
                WHERE a.barber_id = ? AND a.status = 'completed'
                GROUP BY s.id
                ORDER BY service_count DESC
                LIMIT 5
            `, {
                replacements: [id],
                type: sequelize.QueryTypes.SELECT
            });

            // Get barber's availability for the next 7 days
            const availability = await barberController.getBarberAvailability(id);

            res.render('customer/barber-details', {
                title: `${barber.name} - Classic Cuts`,
                user: req.session.user,
                barber,
                averageRating,
                popularServices,
                availability,
                ratings: barber.ratings
            });
        } catch (error) {
            console.error('Barber details error:', error);
            req.flash('error', 'Unable to load barber details');
            res.redirect('/barbers');
        }
    },

    // Get barber availability
    getBarberAvailability: async (barberId) => {
        try {
            const today = new Date();
            const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

            // Get appointments for the next 7 days
            const appointments = await Appointment.findAll({
                where: {
                    barber_id: barberId,
                    appointment_date: {
                        [Op.between]: [today, nextWeek]
                    },
                    status: {
                        [Op.in]: ['pending', 'confirmed']
                    }
                },
                attributes: ['appointment_date'],
                order: [['appointment_date', 'ASC']]
            });

            // Generate availability for the next 7 days
            const availability = [];
            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                
                // Skip weekends if needed
                if (date.getDay() === 0 || date.getDay() === 6) continue;

                const dayAppointments = appointments.filter(apt => {
                    const aptDate = new Date(apt.appointment_date);
                    return aptDate.toDateString() === date.toDateString();
                });

                // Count available slots (9 AM - 7 PM, 30-minute intervals)
                const totalSlots = 20; // 10 hours * 2 slots per hour
                const bookedSlots = dayAppointments.length;
                const availableSlots = totalSlots - bookedSlots;

                availability.push({
                    date: date.toISOString().split('T')[0],
                    day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    available: availableSlots > 0,
                    availableSlots
                });
            }

            return availability;
        } catch (error) {
            console.error('Get availability error:', error);
            return [];
        }
    },

    // Get barbers API endpoint
    getBarbers: async (req, res) => {
        try {
            const barbers = await Barber.findAll({
                where: { is_active: true },
                attributes: ['id', 'name', 'specialty', 'image'],
                include: [{
                    model: Rating,
                    as: 'ratings',
                    attributes: ['rating']
                }]
            });

            // Add average ratings
            const barbersWithRatings = await Promise.all(
                barbers.map(async (barber) => {
                    const ratings = barber.ratings.map(r => r.rating);
                    const averageRating = ratings.length > 0 
                        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
                        : '0.0';
                    
                    return {
                        id: barber.id,
                        name: barber.name,
                        specialty: barber.specialty,
                        image: barber.image,
                        averageRating,
                        totalRatings: ratings.length
                    };
                })
            );

            res.json({ success: true, barbers: barbersWithRatings });
        } catch (error) {
            console.error('Get barbers error:', error);
            res.json({ success: false, error: 'Failed to fetch barbers' });
        }
    },

    // Get barber ratings - ADD THIS MISSING METHOD
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

module.exports = barberController;