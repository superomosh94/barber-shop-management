const db = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

const authController = {
    // Show registration form
    showRegister: (req, res) => {
        res.render('customer/register', {
            title: 'Create Account - Classic Cuts',
            user: req.session.user,
            formData: {}
        });
    },

    // Handle registration
    register: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.flash('error', errors.array().map(err => err.msg));
                return res.render('customer/register', {
                    title: 'Create Account - Classic Cuts',
                    user: null,
                    formData: req.body
                });
            }

            const { name, email, password, phone } = req.body;

            // Create new customer
            const customer = await db.Customer.create({
                name,
                email,
                password,
                phone: phone || null
            });

            req.flash('success', 'Account created successfully! Please log in.');
            res.redirect('/login');

        } catch (error) {
            console.error('Registration error:', error);

            if (error.name === 'SequelizeUniqueConstraintError') {
                req.flash('error', 'Email already registered');
            } else if (error.name === 'SequelizeValidationError') {
                const messages = error.errors.map(err => err.message);
                req.flash('error', messages);
            } else {
                req.flash('error', 'Registration failed. Please try again.');
            }

            res.render('customer/register', {
                title: 'Create Account - Classic Cuts',
                user: null,
                formData: req.body
            });
        }
    },

    // Show login form
    showLogin: (req, res) => {
        res.render('customer/login', {
            title: 'Login - Classic Cuts',
            user: req.session.user,
            formData: {}
        });
    },

    login: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                req.flash('error', errors.array().map(err => err.msg));
                return res.render('customer/login', {
                    title: 'Login - Classic Cuts',
                    user: null,
                    formData: req.body
                });
            }

            const { email, password } = req.body;

            // CHECK ADMIN FIRST
            if (db.AdminUser) {
                let admin = await db.AdminUser.findOne({
                    where: {
                        [Op.or]: [
                            { email: email },
                            { username: email }
                        ]
                    }
                });

                if (admin && admin.is_active) {
                    let isAdminPasswordValid = false;

                    // Check if checkPassword method exists
                    if (typeof admin.checkPassword === 'function') {
                        isAdminPasswordValid = await admin.checkPassword(password);
                    } else {
                        // Fallback for legacy passwords
                        isAdminPasswordValid = password === admin.password;
                    }

                    if (isAdminPasswordValid) {
                        await admin.update({ last_login: new Date() });

                        // Create BOTH session formats for compatibility
                        req.session.user = {
                            id: admin.id,
                            name: `${admin.first_name} ${admin.last_name}`,
                            email: admin.email,
                            username: admin.username,
                            role: admin.role,
                            permissions: admin.permissions
                        };

                        // ALSO create admin session for admin routes
                        req.session.admin = {
                            id: admin.id,
                            username: admin.username,
                            email: admin.email,
                            role: admin.role,
                            first_name: admin.first_name,
                            last_name: admin.last_name,
                            permissions: admin.permissions
                        };

                        req.flash('success', `Welcome back, ${admin.first_name}!`);
                        return res.redirect('/admin/dashboard');
                    }
                }
            }

            // THEN CHECK CUSTOMER
            let customer = await db.Customer.findOne({ where: { email } });

            if (customer && customer.is_active) {
                const isPasswordValid = await customer.checkPassword(password);

                if (isPasswordValid) {
                    await customer.update({ last_login: new Date() });
                    req.session.user = {
                        id: customer.id,
                        name: customer.name,
                        email: customer.email,
                        phone: customer.phone,
                        role: 'customer'
                    };
                    req.flash('success', `Welcome back, ${customer.name}!`);
                    return res.redirect('/customer/dashboard');
                }
            }

            // If we get here, login failed
            req.flash('error', 'Invalid email/username or password');
            return res.render('customer/login', {
                title: 'Login - Classic Cuts',
                user: null,
                formData: req.body
            });

        } catch (error) {
            console.error('Login error:', error);
            req.flash('error', 'Login failed. Please try again.');
            res.render('customer/login', {
                title: 'Login - Classic Cuts',
                user: null,
                formData: req.body
            });
        }
    },

    // Handle logout
    logout: (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
                req.flash('error', 'Logout failed');
                return res.redirect('/customer/dashboard');
            }

            res.redirect('/');
        });
    }
};

module.exports = authController;