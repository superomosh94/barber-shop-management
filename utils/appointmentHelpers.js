const { Appointment, Barber, Service } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const appointmentHelpers = {
    // Generate available time slots for a barber on a specific date
    generateAvailableSlots: async (barberId, date) => {
        try {
            const barber = await Barber.findByPk(barberId);
            if (!barber) {
                throw new Error('Barber not found');
            }

            const selectedDate = new Date(date);
            const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

            // Get existing appointments for the barber on this date
            const existingAppointments = await Appointment.findAll({
                where: {
                    barber_id: barberId,
                    appointment_date: {
                        [Op.between]: [startOfDay, endOfDay]
                    },
                    status: {
                        [Op.in]: ['pending', 'confirmed']
                    }
                },
                order: [['appointment_date', 'ASC']]
            });

            // Generate time slots (9 AM - 7 PM, 30-minute intervals)
            const availableSlots = [];
            const startHour = 9;
            const endHour = 19;
            
            for (let hour = startHour; hour < endHour; hour++) {
                for (let minute = 0; minute < 60; minute += 30) {
                    const slotTime = new Date(selectedDate);
                    slotTime.setHours(hour, minute, 0, 0);
                    
                    // Skip if slot is in the past
                    if (slotTime <= new Date()) {
                        continue;
                    }

                    // Check if slot conflicts with existing appointments
                    const isAvailable = !existingAppointments.some(apt => {
                        const aptTime = new Date(apt.appointment_date);
                        const timeDiff = Math.abs(aptTime - slotTime);
                        return timeDiff < 30 * 60 * 1000; // 30 minutes buffer
                    });

                    if (isAvailable) {
                        availableSlots.push({
                            time: slotTime.toISOString(),
                            display: moment(slotTime).format('h:mm A'),
                            available: true
                        });
                    }
                }
            }

            return availableSlots;
        } catch (error) {
            console.error('Error generating available slots:', error);
            throw error;
        }
    },

    // Check if a barber is available at a specific time
    isBarberAvailable: async (barberId, appointmentDate, duration = 30) => {
        try {
            const appointmentTime = new Date(appointmentDate);
            const appointmentEnd = new Date(appointmentTime.getTime() + duration * 60000);

            const conflictingAppointment = await Appointment.findOne({
                where: {
                    barber_id: barberId,
                    appointment_date: {
                        [Op.between]: [
                            new Date(appointmentTime.getTime() - 29 * 60000),
                            new Date(appointmentEnd.getTime() - 1)
                        ]
                    },
                    status: {
                        [Op.in]: ['pending', 'confirmed']
                    }
                }
            });

            return !conflictingAppointment;
        } catch (error) {
            console.error('Error checking barber availability:', error);
            return false;
        }
    },

    // Calculate appointment end time based on service duration
    calculateAppointmentEnd: (appointmentDate, serviceId) => {
        // This would typically fetch the service duration from the database
        // For now, using default duration
        const defaultDuration = 30; // minutes
        const endTime = new Date(appointmentDate);
        endTime.setMinutes(endTime.getMinutes() + defaultDuration);
        return endTime;
    },

    // Validate appointment date and time
    validateAppointmentDateTime: (appointmentDate) => {
        const now = new Date();
        const appointmentTime = new Date(appointmentDate);

        // Check if appointment is in the future
        if (appointmentTime <= now) {
            return { valid: false, error: 'Appointment must be in the future' };
        }

        // Check business hours (9 AM - 7 PM)
        const hour = appointmentTime.getHours();
        if (hour < 9 || hour >= 19) {
            return { valid: false, error: 'Appointments can only be booked between 9:00 AM and 7:00 PM' };
        }

        // Check if it's a weekend
        const day = appointmentTime.getDay();
        if (day === 0 || day === 6) { // Sunday or Saturday
            return { valid: false, error: 'Appointments are not available on weekends' };
        }

        return { valid: true };
    },

    // Get upcoming appointments for a customer
    getUpcomingAppointments: async (customerId, limit = 5) => {
        try {
            const appointments = await Appointment.findAll({
                where: {
                    customer_id: customerId,
                    appointment_date: {
                        [Op.gte]: new Date()
                    },
                    status: {
                        [Op.in]: ['pending', 'confirmed']
                    }
                },
                include: [
                    { model: Service, as: 'service' },
                    { model: Barber, as: 'barber' }
                ],
                order: [['appointment_date', 'ASC']],
                limit: limit
            });

            return appointments;
        } catch (error) {
            console.error('Error fetching upcoming appointments:', error);
            throw error;
        }
    },

    // Get appointment statistics for dashboard
    getAppointmentStats: async (customerId) => {
        try {
            const totalAppointments = await Appointment.count({
                where: { customer_id: customerId }
            });

            const completedAppointments = await Appointment.count({
                where: { 
                    customer_id: customerId,
                    status: 'completed'
                }
            });

            const pendingRatings = await Appointment.count({
                where: {
                    customer_id: customerId,
                    status: 'completed',
                    '$rating.id$': null
                },
                include: [{
                    model: Rating,
                    as: 'rating',
                    required: false
                }]
            });

            return {
                totalAppointments,
                completedAppointments,
                pendingRatings
            };
        } catch (error) {
            console.error('Error fetching appointment stats:', error);
            throw error;
        }
    }
};

module.exports = appointmentHelpers;