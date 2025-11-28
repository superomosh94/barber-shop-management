const express = require('express');
const router = express.Router();
const { Appointment, Service, Barber, Customer } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

// Book appointment route
router.post('/book', async (req, res) => {
    try {
        const customer_id = req.session.user.id;
        const { service_id, barber_id, appointment_datetime, notes } = req.body;

        // Validate required fields
        if (!service_id || !barber_id || !appointment_datetime) {
            req.flash('error', 'Please fill in all required fields');
            return res.redirect('/customer/booking');
        }

        // Parse the datetime
        const appointmentDate = new Date(appointment_datetime);
        
        // Validate business hours (9 AM to 7 PM)
        const appointmentHour = appointmentDate.getHours();
        const appointmentMinute = appointmentDate.getMinutes();
        
        // Convert to moment for easier time comparison
        const appointmentTime = moment(appointmentDate);
        const businessStart = moment(appointmentDate).set({ hour: 9, minute: 0, second: 0 });
        const businessEnd = moment(appointmentDate).set({ hour: 19, minute: 0, second: 0 });

        if (appointmentTime.isBefore(businessStart) || appointmentTime.isAfter(businessEnd)) {
            req.flash('error', 'Appointments can only be booked between 9:00 AM and 7:00 PM');
            return res.redirect('/customer/booking');
        }

        // Check if appointment is in the past
        if (appointmentDate < new Date()) {
            req.flash('error', 'Cannot book appointments in the past');
            return res.redirect('/customer/booking');
        }

        // Check if barber is available at that time
        const existingAppointment = await Appointment.findOne({
            where: {
                barber_id,
                appointment_date: {
                    [Op.between]: [
                        moment(appointmentDate).subtract(30, 'minutes').toDate(),
                        moment(appointmentDate).add(30, 'minutes').toDate()
                    ]
                },
                status: {
                    [Op.in]: ['pending', 'confirmed']
                }
            }
        });

        if (existingAppointment) {
            req.flash('error', 'Selected barber is not available at that time. Please choose a different time.');
            return res.redirect('/customer/booking');
        }

        // Get service details to calculate total price
        const service = await Service.findByPk(service_id);
        if (!service) {
            req.flash('error', 'Selected service not found');
            return res.redirect('/customer/booking');
        }

        // Create the appointment
        const appointment = await Appointment.create({
            customer_id,
            service_id,
            barber_id,
            appointment_date: appointmentDate,
            total_price: service.price,
            notes: notes || null,
            status: 'pending'
        });

        req.flash('success', 'Appointment booked successfully! We will confirm your appointment shortly.');
        res.redirect('/customer/dashboard');

    } catch (error) {
        console.error('Booking error:', error);
        req.flash('error', 'Failed to book appointment. Please try again.');
        res.redirect('/customer/booking');
    }
});

module.exports = router;