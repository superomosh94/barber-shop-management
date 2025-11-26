const { Customer, Appointment, Rating, Service, Barber } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const customerController = {
    // Show customer dashboard
    showDashboard: async (req, res) => {
        try {
            const customer_id = req.session.user.id;

            // Get upcoming appointments
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
                    { model: Service, as: 'service' },
                    { model: Barber, as: 'barber' }
                ],
                order: [['appointment_date', 'ASC']],
                limit: 5
            });

            // Get appointment history
            const recentAppointments = await Appointment.findAll({
                where: {
                    customer_id,
                    status: {
                        [Op.in]: ['completed', 'cancelled']
                    }
                },
                include: [
                    { model: Service, as: 'service' },
                    { model: Barber, as: 'barber' },
                    { model: Rating, as: 'rating' }
                ],
                order: [['appointment_date', 'DESC']],
                limit: 10
            });

            // Get customer stats
            const totalAppointments = await Appointment.count({ where: { customer_id } });
            const completedAppointments = await Appointment.count({ 
                where: { customer_id, status: 'completed' } 
            });
            const pendingRatings = await Appointment.count({
                where: {
                    customer_id,
                    status: 'completed',
                    '$rating.id$': null
                },
                include: [{
                    model: Rating,
                    as: 'rating',
                    required: false
                }]
            });

            res.render('customer/dashboard', {
                title: 'My Dashboard - Classic Cuts',
                user: req.session.user,
                upcomingAppointments,
                recentAppointments,
                stats: {
                    totalAppointments,
                    completedAppointments,
                    pendingRatings
                },
                moment
            });
        } catch (error) {
            console.error('Customer dashboard error:', error);
            req.flash('error', 'Unable to load dashboard');
            res.redirect('/');
        }
    },

    // Show customer profile
    showProfile: async (req, res) => {
        try {
            const customer_id = req.session.user.id;
            const customer = await Customer.findByPk(customer_id);

            if (!customer) {
                req.flash('error', 'Customer not found');
                return res.redirect('/customer/dashboard');
            }

            res.render('customer/profile', {
                title: 'My Profile - Classic Cuts',
                user: req.session.user,
                customer
            });
        } catch (error) {
            console.error('Profile error:', error);
            req.flash('error', 'Unable to load profile');
            res.redirect('/customer/dashboard');
        }
    },

    // Update customer profile
    updateProfile: async (req, res) => {
        try {
            const customer_id = req.session.user.id;
            const { name, phone } = req.body;

            const customer = await Customer.findByPk(customer_id);
            if (!customer) {
                req.flash('error', 'Customer not found');
                return res.redirect('/customer/dashboard');
            }

            await customer.update({
                name: name || customer.name,
                phone: phone || customer.phone
            });

            // Update session
            req.session.user.name = customer.name;
            req.session.user.phone = customer.phone;

            req.flash('success', 'Profile updated successfully');
            res.redirect('/customer/profile');

        } catch (error) {
            console.error('Update profile error:', error);
            req.flash('error', 'Failed to update profile');
            res.redirect('/customer/profile');
        }
    },

    // Show appointment history
    showAppointmentHistory: async (req, res) => {
        try {
            const customer_id = req.session.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;

            const { count, rows: appointments } = await Appointment.findAndCountAll({
                where: { customer_id },
                include: [
                    { model: Service, as: 'service' },
                    { model: Barber, as: 'barber' },
                    { model: Rating, as: 'rating' }
                ],
                order: [['appointment_date', 'DESC']],
                limit,
                offset
            });

            const totalPages = Math.ceil(count / limit);

            res.render('customer/appointment-history', {
                title: 'Appointment History - Classic Cuts',
                user: req.session.user,
                appointments,
                currentPage: page,
                totalPages,
                moment
            });
        } catch (error) {
            console.error('Appointment history error:', error);
            req.flash('error', 'Unable to load appointment history');
            res.redirect('/customer/dashboard');
        }
    },

    // Change password
    showChangePassword: (req, res) => {
        res.render('customer/change-password', {
            title: 'Change Password - Classic Cuts',
            user: req.session.user
        });
    },

    updatePassword: async (req, res) => {
        try {
            const customer_id = req.session.user.id;
            const { current_password, new_password, confirm_password } = req.body;

            const customer = await Customer.findByPk(customer_id);
            if (!customer) {
                req.flash('error', 'Customer not found');
                return res.redirect('/customer/change-password');
            }

            // Verify current password
            const isCurrentPasswordValid = await customer.checkPassword(current_password);
            if (!isCurrentPasswordValid) {
                req.flash('error', 'Current password is incorrect');
                return res.redirect('/customer/change-password');
            }

            // Check if new password matches confirmation
            if (new_password !== confirm_password) {
                req.flash('error', 'New passwords do not match');
                return res.redirect('/customer/change-password');
            }

            // Update password
            await customer.update({ password: new_password });

            req.flash('success', 'Password updated successfully');
            res.redirect('/customer/profile');

        } catch (error) {
            console.error('Update password error:', error);
            req.flash('error', 'Failed to update password');
            res.redirect('/customer/change-password');
        }
    }
};

module.exports = customerController;