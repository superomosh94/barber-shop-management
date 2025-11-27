const { Customer, Appointment, Service, Barber, sequelize } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const customerController = {
    // Show customer dashboard - enhanced version
    showDashboard: async (req, res) => {
        try {
            const customer_id = req.session.user.id;

            // Get customer details
            const customer = await Customer.findByPk(customer_id, {
                attributes: ['id', 'name', 'email', 'phone', 'created_at']
            });

            if (!customer) {
                req.flash('error', 'Customer account not found');
                return res.redirect('/auth/login');
            }

            // Get upcoming appointments - FIXED: Removed specialization from attributes
            const upcomingAppointments = await Appointment.findAll({
                where: {
                    customer_id,
                    appointment_date: {
                        [Op.gte]: new Date()
                    },
                    status: {
                        [Op.in]: ['pending', 'confirmed']
                    }
                },
                include: [
                    { 
                        model: Service, 
                        as: 'service',
                        attributes: ['id', 'name', 'price', 'duration']
                    },
                    { 
                        model: Barber, 
                        as: 'barber',
                        attributes: ['id', 'name'] // Removed specialization
                    }
                ],
                order: [['appointment_date', 'ASC']],
                limit: 5
            });

            // Get recent appointment history - FIXED: Removed specialization
            const recentAppointments = await Appointment.findAll({
                where: {
                    customer_id,
                    status: {
                        [Op.in]: ['completed', 'cancelled']
                    }
                },
                include: [
                    { 
                        model: Service, 
                        as: 'service',
                        attributes: ['id', 'name', 'price']
                    },
                    { 
                        model: Barber, 
                        as: 'barber',
                        attributes: ['id', 'name'] // Removed specialization
                    }
                ],
                order: [['appointment_date', 'DESC']],
                limit: 5
            });

            // Get comprehensive customer statistics
            const totalAppointments = await Appointment.count({ 
                where: { customer_id } 
            });

            const completedAppointments = await Appointment.count({ 
                where: { 
                    customer_id, 
                    status: 'completed' 
                } 
            });

            const pendingAppointments = await Appointment.count({ 
                where: { 
                    customer_id, 
                    status: 'pending' 
                } 
            });

            const cancelledAppointments = await Appointment.count({ 
                where: { 
                    customer_id, 
                    status: 'cancelled' 
                } 
            });

            // Calculate total spending
            const totalSpending = await Appointment.sum('total_price', {
                where: { 
                    customer_id, 
                    status: 'completed' 
                }
            }) || 0;

            // Get pending appointments count for sidebar
            const pendingAppointmentsCount = await Appointment.count({ 
                where: { 
                    customer_id, 
                    status: 'pending' 
                } 
            });

            // Get appointments pending ratings
            const Rating = require('../models').Rating;
            const pendingRatings = await Appointment.count({
                where: {
                    customer_id,
                    status: 'completed',
                    '$rating.id$': null
                },
                include: [{
                    model: Rating,
                    as: 'rating',
                    required: false,
                    attributes: []
                }]
            });

            // Get favorite barber - FIXED: Simplified query
            const favoriteBarberData = await Appointment.findAll({
                where: {
                    customer_id,
                    status: 'completed'
                },
                attributes: [
                    'barber_id',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'appointment_count']
                ],
                group: ['barber_id'],
                order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
                limit: 1,
                raw: true
            });

            let favoriteBarber = null;
            if (favoriteBarberData.length > 0 && favoriteBarberData[0].barber_id) {
                const barber = await Barber.findByPk(favoriteBarberData[0].barber_id, {
                    attributes: ['id', 'name']
                });
                if (barber) {
                    favoriteBarber = {
                        id: barber.id,
                        name: barber.name,
                        appointmentCount: favoriteBarberData[0].appointment_count
                    };
                }
            }

            // Get most used service - FIXED: Simplified query
            const favoriteServiceData = await Appointment.findAll({
                where: {
                    customer_id,
                    status: 'completed'
                },
                attributes: [
                    'service_id',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'service_count']
                ],
                group: ['service_id'],
                order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
                limit: 1,
                raw: true
            });

            let favoriteService = null;
            if (favoriteServiceData.length > 0 && favoriteServiceData[0].service_id) {
                const service = await Service.findByPk(favoriteServiceData[0].service_id, {
                    attributes: ['id', 'name']
                });
                if (service) {
                    favoriteService = {
                        id: service.id,
                        name: service.name,
                        serviceCount: favoriteServiceData[0].service_count
                    };
                }
            }

            res.render('customer/dashboard', {
                title: 'My Dashboard - Classic Cuts',
                user: req.session.user,
                customer,
                upcomingAppointments,
                recentAppointments,
                stats: {
                    totalAppointments,
                    completedAppointments,
                    pendingAppointments,
                    cancelledAppointments,
                    pendingRatings,
                    totalSpending,
                    favoriteBarber,
                    favoriteService
                },
                pendingAppointmentsCount,
                moment,
                currentPage: 'dashboard'
            });

        } catch (error) {
            console.error('Customer dashboard error:', error);
            req.flash('error', 'Unable to load dashboard. Please try again.');
            res.redirect('/');
        }
    },

    // Show customer profile - enhanced
    showProfile: async (req, res) => {
        try {
            const customer_id = req.session.user.id;
            
            const customer = await Customer.findByPk(customer_id, {
                attributes: ['id', 'name', 'email', 'phone', 'created_at', 'updated_at']
            });

            if (!customer) {
                req.flash('error', 'Customer profile not found');
                return res.redirect('/customer/dashboard');
            }

            // Get comprehensive profile statistics
            const totalAppointments = await Appointment.count({ 
                where: { customer_id } 
            });

            const completedAppointments = await Appointment.count({ 
                where: { 
                    customer_id, 
                    status: 'completed' 
                } 
            });

            const pendingAppointments = await Appointment.count({ 
                where: { 
                    customer_id, 
                    status: 'pending' 
                } 
            });

            const cancelledAppointments = await Appointment.count({ 
                where: { 
                    customer_id, 
                    status: 'cancelled' 
                } 
            });

            const totalSpending = await Appointment.sum('total_price', {
                where: { 
                    customer_id, 
                    status: 'completed' 
                }
            }) || 0;

            const totalRatings = await require('../models').Rating.count({ 
                where: { customer_id } 
            });

            // Get pending appointments count for sidebar
            const pendingAppointmentsCount = await Appointment.count({ 
                where: { 
                    customer_id, 
                    status: 'pending' 
                } 
            });

            res.render('customer/profile', {
                title: 'My Profile - Classic Cuts',
                user: req.session.user,
                customer,
                profileStats: {
                    totalAppointments,
                    completedAppointments,
                    pendingAppointments,
                    cancelledAppointments,
                    totalRatings,
                    totalSpending
                },
                pendingAppointmentsCount,
                moment,
                currentPage: 'profile'
            });

        } catch (error) {
            console.error('Profile error:', error);
            req.flash('error', 'Unable to load profile information');
            res.redirect('/customer/dashboard');
        }
    },

    // Update customer profile with validation
    updateProfile: async (req, res) => {
        try {
            const customer_id = req.session.user.id;
            const { name, phone, email } = req.body;

            const customer = await Customer.findByPk(customer_id);
            if (!customer) {
                req.flash('error', 'Customer account not found');
                return res.redirect('/customer/dashboard');
            }

            // Validate required fields
            if (!name || !name.trim()) {
                req.flash('error', 'Name is required');
                return res.redirect('/customer/profile');
            }

            const updateData = {
                name: name.trim(),
                phone: phone?.trim() || customer.phone
            };

            // Check if email is being changed and validate
            if (email && email !== customer.email) {
                // Check if email already exists
                const existingCustomer = await Customer.findOne({
                    where: {
                        email: email.trim(),
                        id: { [Op.ne]: customer_id }
                    }
                });

                if (existingCustomer) {
                    req.flash('error', 'Email address is already registered');
                    return res.redirect('/customer/profile');
                }

                updateData.email = email.trim();
            }

            await customer.update(updateData);

            // Update session data
            req.session.user.name = updateData.name;
            req.session.user.email = updateData.email || customer.email;
            req.session.user.phone = updateData.phone;

            req.flash('success', 'Profile updated successfully');
            res.redirect('/customer/profile');

        } catch (error) {
            console.error('Update profile error:', error);
            
            if (error.name === 'SequelizeValidationError') {
                const validationErrors = error.errors.map(err => err.message);
                req.flash('error', validationErrors.join(', '));
            } else if (error.name === 'SequelizeUniqueConstraintError') {
                req.flash('error', 'Email address is already registered');
            } else {
                req.flash('error', 'Failed to update profile. Please try again.');
            }
            
            res.redirect('/customer/profile');
        }
    },

    // Show appointment history with filtering
    showAppointmentHistory: async (req, res) => {
        try {
            const customer_id = req.session.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;
            
            // Get filter parameters
            const status = req.query.status || 'all';
            const dateFrom = req.query.date_from;
            const dateTo = req.query.date_to;

            // Build where clause for filtering
            const where = { customer_id };
            
            if (status !== 'all') {
                where.status = status;
            }

            if (dateFrom || dateTo) {
                where.appointment_date = {};
                if (dateFrom) {
                    where.appointment_date[Op.gte] = new Date(dateFrom);
                }
                if (dateTo) {
                    const endDate = new Date(dateTo);
                    endDate.setDate(endDate.getDate() + 1);
                    where.appointment_date[Op.lt] = endDate;
                }
            }

            const { count, rows: appointments } = await Appointment.findAndCountAll({
                where,
                include: [
                    { 
                        model: Service, 
                        as: 'service',
                        attributes: ['id', 'name', 'price', 'duration']
                    },
                    { 
                        model: Barber, 
                        as: 'barber',
                        attributes: ['id', 'name'] // Removed specialization
                    }
                ],
                order: [['appointment_date', 'DESC']],
                limit,
                offset
            });

            const totalPages = Math.ceil(count / limit);

            // Get appointment statistics for filters
            const appointmentStats = await Appointment.findAll({
                where: { customer_id },
                attributes: [
                    'status',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: ['status'],
                raw: true
            });

            // Get pending appointments count for sidebar
            const pendingAppointmentsCount = await Appointment.count({ 
                where: { 
                    customer_id, 
                    status: 'pending' 
                } 
            });

            res.render('customer/appointment-history', {
                title: 'Appointment History - Classic Cuts',
                user: req.session.user,
                appointments,
                appointmentStats,
                currentPage: page,
                totalPages,
                currentStatus: status,
                dateFrom,
                dateTo,
                pendingAppointmentsCount,
                moment,
                currentPageNav: 'history'
            });

        } catch (error) {
            console.error('Appointment history error:', error);
            req.flash('error', 'Unable to load appointment history');
            res.redirect('/customer/dashboard');
        }
    },

    // Get appointment details for modal
    getAppointmentDetails: async (req, res) => {
        try {
            const customer_id = req.session.user.id;
            const { id } = req.params;

            const appointment = await Appointment.findOne({
                where: {
                    id,
                    customer_id
                },
                include: [
                    { 
                        model: Service, 
                        as: 'service',
                        attributes: ['id', 'name', 'price', 'duration', 'description']
                    },
                    { 
                        model: Barber, 
                        as: 'barber',
                        attributes: ['id', 'name', 'experience', 'bio'] // Removed specialization
                    },
                    { 
                        model: require('../models').Rating, 
                        as: 'rating',
                        attributes: ['id', 'rating', 'comment', 'created_at']
                    }
                ]
            });

            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    error: 'Appointment not found or access denied'
                });
            }

            res.json({
                success: true,
                appointment
            });

        } catch (error) {
            console.error('Get appointment details error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch appointment details'
            });
        }
    },

    // Cancel appointment with validation
    cancelAppointment: async (req, res) => {
        try {
            const customer_id = req.session.user.id;
            const { id } = req.params;
            const { cancellation_reason } = req.body;

            const appointment = await Appointment.findOne({
                where: {
                    id,
                    customer_id,
                    status: ['pending', 'confirmed']
                }
            });

            if (!appointment) {
                req.flash('error', 'Appointment not found or cannot be cancelled');
                return res.redirect('/customer/appointment-history');
            }

            // Check if appointment is within cancellation window (e.g., 2 hours before)
            const appointmentTime = new Date(appointment.appointment_date);
            const currentTime = new Date();
            const timeDifference = appointmentTime.getTime() - currentTime.getTime();
            const hoursDifference = timeDifference / (1000 * 60 * 60);

            if (hoursDifference < 2) {
                req.flash('error', 'Appointments can only be cancelled at least 2 hours in advance');
                return res.redirect('/customer/appointment-history');
            }

            await appointment.update({
                status: 'cancelled',
                cancellation_reason: cancellation_reason || 'No reason provided',
                cancelled_at: new Date()
            });

            req.flash('success', 'Appointment cancelled successfully');
            res.redirect('/customer/appointment-history');

        } catch (error) {
            console.error('Cancel appointment error:', error);
            req.flash('error', 'Failed to cancel appointment');
            res.redirect('/customer/appointment-history');
        }
    },

    // Change password page
    showChangePassword: async (req, res) => {
        try {
            const customer_id = req.session.user.id;
            
            // Get pending appointments count for sidebar
            const pendingAppointmentsCount = await Appointment.count({ 
                where: { 
                    customer_id, 
                    status: 'pending' 
                } 
            });

            res.render('customer/change-password', {
                title: 'Change Password - Classic Cuts',
                user: req.session.user,
                pendingAppointmentsCount,
                currentPage: 'password'
            });
        } catch (error) {
            console.error('Change password page error:', error);
            req.flash('error', 'Unable to load page');
            res.redirect('/customer/dashboard');
        }
    },

    // Update password with comprehensive validation
    updatePassword: async (req, res) => {
        try {
            const customer_id = req.session.user.id;
            const { current_password, new_password, confirm_password } = req.body;

            const customer = await Customer.findByPk(customer_id);
            if (!customer) {
                req.flash('error', 'Customer account not found');
                return res.redirect('/customer/change-password');
            }

            // Validate required fields
            if (!current_password || !new_password || !confirm_password) {
                req.flash('error', 'All password fields are required');
                return res.redirect('/customer/change-password');
            }

            // Verify current password
            const isCurrentPasswordValid = await customer.checkPassword(current_password);
            if (!isCurrentPasswordValid) {
                req.flash('error', 'Current password is incorrect');
                return res.redirect('/customer/change-password');
            }

            // Check if new password is different from current password
            if (current_password === new_password) {
                req.flash('error', 'New password must be different from current password');
                return res.redirect('/customer/change-password');
            }

            // Check if new password matches confirmation
            if (new_password !== confirm_password) {
                req.flash('error', 'New passwords do not match');
                return res.redirect('/customer/change-password');
            }

            // Validate password strength
            if (new_password.length < 8) {
                req.flash('error', 'Password must be at least 8 characters long');
                return res.redirect('/customer/change-password');
            }

            await customer.update({ 
                password: new_password
            });

            req.flash('success', 'Password updated successfully');
            res.redirect('/customer/profile');

        } catch (error) {
            console.error('Update password error:', error);
            
            if (error.name === 'SequelizeValidationError') {
                const validationErrors = error.errors.map(err => err.message);
                req.flash('error', validationErrors.join(', '));
            } else {
                req.flash('error', 'Failed to update password. Please try again.');
            }
            
            res.redirect('/customer/change-password');
        }
    },

    // Export appointment history
    exportAppointmentHistory: async (req, res) => {
        try {
            const customer_id = req.session.user.id;
            const format = req.query.format || 'json'; // json, csv

            const appointments = await Appointment.findAll({
                where: { customer_id },
                include: [
                    { 
                        model: Service, 
                        as: 'service',
                        attributes: ['name', 'price']
                    },
                    { 
                        model: Barber, 
                        as: 'barber',
                        attributes: ['name']
                    }
                ],
                order: [['appointment_date', 'DESC']],
                attributes: ['id', 'appointment_date', 'status', 'total_price', 'notes']
            });

            if (format === 'csv') {
                // Generate CSV content
                const csvContent = [
                    ['Date', 'Service', 'Barber', 'Status', 'Price', 'Notes'],
                    ...appointments.map(apt => [
                        moment(apt.appointment_date).format('YYYY-MM-DD HH:mm'),
                        apt.service?.name || 'N/A',
                        apt.barber?.name || 'N/A',
                        apt.status,
                        `$${apt.total_price}`,
                        apt.notes || 'N/A'
                    ])
                ].map(row => row.join(',')).join('\n');

                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename=appointment-history.csv');
                return res.send(csvContent);
            }

            // Default JSON response
            res.json({
                success: true,
                data: appointments
            });

        } catch (error) {
            console.error('Export appointment history error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to export appointment history'
            });
        }
    }
};

module.exports = customerController;