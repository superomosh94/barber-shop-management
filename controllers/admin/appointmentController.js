const { Appointment, Customer, Service, Barber } = require('../../models');
const { Op } = require('sequelize');
const moment = require('moment');

const appointmentController = {
    // Appointment Management
    showAppointments: async (req, res) => {
        try {
            const { status, page = 1, date } = req.query;
            const limit = 20;
            const offset = (page - 1) * limit;

            const where = {};
            if (status && status !== 'all') where.status = status;
            if (date) {
                const startDate = new Date(date);
                const endDate = new Date(date);
                endDate.setDate(endDate.getDate() + 1);
                where.appointment_date = { [Op.between]: [startDate, endDate] };
            }

            // Get appointments with pagination
            const { count, rows: appointments } = await Appointment.findAndCountAll({
                where,
                include: [
                    {
                        model: Customer,
                        as: 'customer',
                        attributes: ['id', 'name', 'phone']
                    },
                    {
                        model: Service,
                        as: 'service',
                        attributes: ['id', 'name', 'price', 'duration']
                    },
                    {
                        model: Barber,
                        as: 'barber',
                        attributes: ['id', 'name']
                    }
                ],
                order: [['appointment_date', 'DESC']],
                limit,
                offset
            });

            // Get all barbers for the filter dropdown
            const barbers = await Barber.findAll({
                where: { is_active: true },
                order: [['name', 'ASC']],
                attributes: ['id', 'name']
            });

            // Get all customers for the new appointment form
            const customers = await Customer.findAll({
                order: [['name', 'ASC']],
                attributes: ['id', 'name', 'phone']
            });

            // Get all services for the new appointment form
            const services = await Service.findAll({
                where: { is_active: true },
                order: [['name', 'ASC']],
                attributes: ['id', 'name', 'price', 'duration']
            });

            // Calculate pending appointments count for sidebar
            const pendingAppointmentsCount = await Appointment.count({
                where: { status: 'pending' }
            });

            const totalPages = Math.ceil(count / limit);

            res.render('admin/appointments', {
                title: 'Appointment Management - Classic Cuts',
                layout: 'admin-layout',
                admin: req.session.admin,
                appointments,
                barbers,
                customers,
                services,
                pendingAppointmentsCount,
                currentPage: 'appointments',
                currentStatus: status,
                currentDate: date,
                currentPageNum: parseInt(page),
                totalPages,
                moment
            });
        } catch (error) {
            console.error('Appointment management error:', error);
            req.flash('error', 'Unable to load appointments');
            res.redirect('/admin/dashboard');
        }
    },

    // Create new appointment
    createAppointment: async (req, res) => {
        try {
            const { customer_id, service_id, barber_id, appointment_date, appointment_time, status, notes } = req.body;

            // Get service price
            const service = await Service.findByPk(service_id);
            if (!service) {
                return res.status(404).json({ success: false, error: 'Service not found' });
            }

            // Combine date and time
            const appointmentDateTime = new Date(`${appointment_date}T${appointment_time}`);

            const appointment = await Appointment.create({
                customer_id,
                service_id,
                barber_id,
                appointment_date: appointmentDateTime,
                total_price: service.price,
                status: status || 'pending',
                notes: notes || null
            });

            res.json({
                success: true,
                message: 'Appointment created successfully',
                appointment
            });
        } catch (error) {
            console.error('Create appointment error:', error);
            res.status(500).json({ success: false, error: 'Failed to create appointment' });
        }
    },

    // Get single appointment for editing
    getAppointment: async (req, res) => {
        try {
            const { id } = req.params;

            const appointment = await Appointment.findByPk(id, {
                include: [
                    { model: Customer, as: 'customer' },
                    { model: Service, as: 'service' },
                    { model: Barber, as: 'barber' }
                ]
            });

            if (!appointment) {
                return res.status(404).json({ success: false, error: 'Appointment not found' });
            }

            res.json({ success: true, appointment });
        } catch (error) {
            console.error('Get appointment error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch appointment' });
        }
    },

    // Update appointment
    updateAppointment: async (req, res) => {
        try {
            const { id } = req.params;
            const { customer_id, service_id, barber_id, appointment_date, appointment_time, status, notes } = req.body;

            const appointment = await Appointment.findByPk(id);
            if (!appointment) {
                return res.status(404).json({ success: false, error: 'Appointment not found' });
            }

            // Get service price if service changed
            let total_price = appointment.total_price;
            if (service_id && service_id !== appointment.service_id) {
                const service = await Service.findByPk(service_id);
                if (service) {
                    total_price = service.price;
                }
            }

            // Combine date and time
            let appointmentDateTime = appointment.appointment_date;
            if (appointment_date && appointment_time) {
                appointmentDateTime = new Date(`${appointment_date}T${appointment_time}`);
            }

            await appointment.update({
                customer_id: customer_id || appointment.customer_id,
                service_id: service_id || appointment.service_id,
                barber_id: barber_id || appointment.barber_id,
                appointment_date: appointmentDateTime,
                total_price,
                status: status || appointment.status,
                notes: notes !== undefined ? notes : appointment.notes
            });

            res.json({
                success: true,
                message: 'Appointment updated successfully'
            });
        } catch (error) {
            console.error('Update appointment error:', error);
            res.status(500).json({ success: false, error: 'Failed to update appointment' });
        }
    },

    // Delete appointment
    deleteAppointment: async (req, res) => {
        try {
            const { id } = req.params;

            const appointment = await Appointment.findByPk(id);
            if (!appointment) {
                return res.status(404).json({ success: false, error: 'Appointment not found' });
            }

            await appointment.destroy();

            res.json({
                success: true,
                message: 'Appointment deleted successfully'
            });
        } catch (error) {
            console.error('Delete appointment error:', error);
            res.status(500).json({ success: false, error: 'Failed to delete appointment' });
        }
    },

    // Update Appointment Status
    updateAppointmentStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ success: false, error: 'Invalid status' });
            }

            const appointment = await Appointment.findByPk(id);
            if (!appointment) {
                return res.status(404).json({ success: false, error: 'Appointment not found' });
            }

            await appointment.update({ status });

            res.json({
                success: true,
                message: `Appointment ${status} successfully`
            });
        } catch (error) {
            console.error('Update appointment status error:', error);
            res.status(500).json({ success: false, error: 'Failed to update appointment' });
        }
    },

    // API routes for appointment management
    getAppointmentsApi: async (req, res) => {
        try {
            const { status, page = 1, limit = 10, date } = req.query;
            const offset = (page - 1) * limit;

            const where = {};
            if (status && status !== 'all') where.status = status;
            if (date) {
                const startDate = new Date(date);
                const endDate = new Date(date);
                endDate.setDate(endDate.getDate() + 1);
                where.appointment_date = { [Op.between]: [startDate, endDate] };
            }

            const { count, rows: appointments } = await Appointment.findAndCountAll({
                where,
                include: [
                    { model: Customer, as: 'customer' },
                    { model: Service, as: 'service' },
                    { model: Barber, as: 'barber' }
                ],
                order: [['appointment_date', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                success: true,
                data: appointments,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalItems: count
                }
            });
        } catch (error) {
            console.error('Get appointments API error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch appointments' });
        }
    }
};

module.exports = appointmentController;
