const { Appointment, Service, Barber, Customer, Rating, sequelize } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const appointmentController = {
    // Show booking form
    showBooking: async (req, res) => {
        try {
            const services = await Service.findAll({ 
                where: { is_active: true },
                order: [['price', 'ASC']]
            });
            
            const barbers = await Barber.findAll({ 
                where: { is_active: true },
                order: [['name', 'ASC']]
            });

            res.render('customer/booking', {
                title: 'Book Appointment - Classic Cuts',
                user: req.session.user,
                services,
                barbers,
                moment
            });
        } catch (error) {
            console.error('Booking page error:', error);
            req.flash('error', 'Unable to load booking page');
            res.redirect('/services');
        }
    },

    // Handle appointment booking
    bookAppointment: async (req, res) => {
        try {
            const { service_id, barber_id, appointment_date, notes } = req.body;
            const customer_id = req.session.user.id;

            // Validate appointment date
            const appointmentDate = new Date(appointment_date);
            const now = new Date();
            
            if (appointmentDate <= now) {
                req.flash('error', 'Appointment date must be in the future');
                return res.redirect('/appointments/book');
            }

            // Check business hours (9 AM - 7 PM)
            const hour = appointmentDate.getHours();
            if (hour < 9 || hour >= 19) {
                req.flash('error', 'Appointments can only be booked between 9:00 AM and 7:00 PM');
                return res.redirect('/appointments/book');
            }

            // Check if barber is available at that time
            const existingAppointment = await Appointment.findOne({
                where: {
                    barber_id,
                    appointment_date: {
                        [Op.between]: [
                            new Date(appointmentDate.getTime() - 29 * 60000), // 29 minutes before
                            new Date(appointmentDate.getTime() + 29 * 60000)  // 29 minutes after
                        ]
                    },
                    status: {
                        [Op.in]: ['pending', 'confirmed']
                    }
                }
            });

            if (existingAppointment) {
                req.flash('error', 'Barber is not available at the selected time. Please choose a different time.');
                return res.redirect('/appointments/book');
            }

            // Create appointment
            const appointment = await Appointment.create({
                customer_id,
                service_id,
                barber_id,
                appointment_date: appointmentDate,
                notes: notes || null,
                status: 'pending'
            });

            req.flash('success', 'Appointment booked successfully! We will confirm your appointment shortly.');
            res.redirect('/customer/dashboard');

        } catch (error) {
            console.error('Booking error:', error);
            req.flash('error', 'Failed to book appointment. Please try again.');
            res.redirect('/appointments/book');
        }
    },

    // Get available time slots for a barber
    getAvailableSlots: async (req, res) => {
        try {
            const { barber_id, date } = req.query;
            
            if (!barber_id || !date) {
                return res.json({ success: false, error: 'Barber ID and date are required' });
            }

            const selectedDate = new Date(date);
            const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

            // Get barber's existing appointments for the day
            const appointments = await Appointment.findAll({
                where: {
                    barber_id,
                    appointment_date: {
                        [Op.between]: [startOfDay, endOfDay]
                    },
                    status: {
                        [Op.in]: ['pending', 'confirmed']
                    }
                },
                order: [['appointment_date', 'ASC']]
            });

            // Generate available time slots (9 AM - 7 PM, 30-minute intervals)
            const availableSlots = [];
            const startHour = 9;
            const endHour = 19;
            
            for (let hour = startHour; hour < endHour; hour++) {
                for (let minute = 0; minute < 60; minute += 30) {
                    const slotTime = new Date(selectedDate);
                    slotTime.setHours(hour, minute, 0, 0);
                    
                    // Check if slot is available
                    const isAvailable = !appointments.some(apt => {
                        const aptTime = new Date(apt.appointment_date);
                        return Math.abs(aptTime - slotTime) < 30 * 60 * 1000; // 30 minutes buffer
                    });
                    
                    if (isAvailable && slotTime > new Date()) {
                        availableSlots.push({
                            time: slotTime.toISOString(),
                            display: moment(slotTime).format('h:mm A')
                        });
                    }
                }
            }

            res.json({ success: true, slots: availableSlots });

        } catch (error) {
            console.error('Available slots error:', error);
            res.json({ success: false, error: 'Failed to fetch available slots' });
        }
    },

    // Show appointment details
    showAppointment: async (req, res) => {
        try {
            const { id } = req.params;
            const customer_id = req.session.user.id;

            const appointment = await Appointment.findOne({
                where: { id, customer_id },
                include: [
                    { model: Service, as: 'service' },
                    { model: Barber, as: 'barber' },
                    { model: Customer, as: 'customer' },
                    { model: Rating, as: 'rating' }
                ]
            });

            if (!appointment) {
                req.flash('error', 'Appointment not found');
                return res.redirect('/customer/dashboard');
            }

            res.render('customer/appointment-details', {
                title: 'Appointment Details - Classic Cuts',
                user: req.session.user,
                appointment,
                moment
            });
        } catch (error) {
            console.error('Appointment details error:', error);
            req.flash('error', 'Unable to load appointment details');
            res.redirect('/customer/dashboard');
        }
    },

    // Cancel appointment
    cancelAppointment: async (req, res) => {
        try {
            const { id } = req.params;
            const customer_id = req.session.user.id;

            const appointment = await Appointment.findOne({
                where: { id, customer_id }
            });

            if (!appointment) {
                req.flash('error', 'Appointment not found');
                return res.redirect('/customer/dashboard');
            }

            if (!appointment.canBeCancelled()) {
                req.flash('error', 'Appointments can only be cancelled at least 2 hours in advance');
                return res.redirect(`/appointments/${id}`);
            }

            if (appointment.status === 'cancelled') {
                req.flash('error', 'Appointment is already cancelled');
                return res.redirect(`/appointments/${id}`);
            }

            await appointment.update({
                status: 'cancelled',
                cancellation_reason: req.body.reason || 'Cancelled by customer'
            });

            req.flash('success', 'Appointment cancelled successfully');
            res.redirect('/customer/dashboard');

        } catch (error) {
            console.error('Cancel appointment error:', error);
            req.flash('error', 'Failed to cancel appointment');
            res.redirect(`/appointments/${req.params.id}`);
        }
    },

    // Reschedule appointment
    rescheduleAppointment: async (req, res) => {
        try {
            const { id } = req.params;
            const { new_date } = req.body;
            const customer_id = req.session.user.id;

            const appointment = await Appointment.findOne({
                where: { id, customer_id }
            });

            if (!appointment) {
                req.flash('error', 'Appointment not found');
                return res.redirect('/customer/dashboard');
            }

            const newDate = new Date(new_date);
            if (newDate <= new Date()) {
                req.flash('error', 'New appointment date must be in the future');
                return res.redirect(`/appointments/${id}`);
            }

            // Check barber availability for new time
            const conflictingAppointment = await Appointment.findOne({
                where: {
                    barber_id: appointment.barber_id,
                    appointment_date: {
                        [Op.between]: [
                            new Date(newDate.getTime() - 29 * 60000),
                            new Date(newDate.getTime() + 29 * 60000)
                        ]
                    },
                    status: {
                        [Op.in]: ['pending', 'confirmed']
                    },
                    id: { [Op.ne]: id }
                }
            });

            if (conflictingAppointment) {
                req.flash('error', 'Barber is not available at the selected time');
                return res.redirect(`/appointments/${id}`);
            }

            await appointment.update({
                appointment_date: newDate,
                status: 'pending' // Reset to pending for reconfirmation
            });

            req.flash('success', 'Appointment rescheduled successfully!');
            res.redirect(`/appointments/${id}`);

        } catch (error) {
            console.error('Reschedule error:', error);
            req.flash('error', 'Failed to reschedule appointment');
            res.redirect(`/appointments/${req.params.id}`);
        }
    }
};

module.exports = appointmentController;