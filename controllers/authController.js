const { Customer } = require('../models');
const { validationResult } = require('express-validator');

const authController = {
    // Show registration form
    showRegister: (req, res) => {
        res.render('customer/register', {
            title: 'Create Account - Classic Cuts',
            user: req.session.user,
            formData: {} // Add this line to fix the error
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
            const customer = await Customer.create({
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
            formData: {} // Add this line to fix the error
        });
    },

    // Handle login
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

            // Find customer by email
            const customer = await Customer.findOne({ where: { email } });
            
            if (!customer) {
                req.flash('error', 'Invalid email or password');
                return res.render('customer/login', {
                    title: 'Login - Classic Cuts',
                    user: null,
                    formData: req.body
                });
            }

            // Check if account is active
            if (!customer.is_active) {
                req.flash('error', 'Account is deactivated. Please contact support.');
                return res.render('customer/login', {
                    title: 'Login - Classic Cuts',
                    user: null,
                    formData: req.body
                });
            }

            // Check password
            const isPasswordValid = await customer.checkPassword(password);
            if (!isPasswordValid) {
                req.flash('error', 'Invalid email or password');
                return res.render('customer/login', {
                    title: 'Login - Classic Cuts',
                    user: null,
                    formData: req.body
                });
            }

            // Update last login
            await customer.update({ last_login: new Date() });

            // Create session
            req.session.user = {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone
            };

            req.flash('success', `Welcome back, ${customer.name}!`);
            res.redirect('/customer/dashboard');

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