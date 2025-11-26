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
            
            console.log('🔐 === LOGIN ATTEMPT START ===');
            console.log('📧 Email/Username:', email);
            console.log('🔑 Password length:', password.length);

            // CHECK ADMIN FIRST
            console.log('👨‍💼 === CHECKING ADMIN ===');
            if (db.AdminUser) {
                let admin = await db.AdminUser.findOne({ 
                    where: { 
                        [Op.or]: [
                            { email: email },
                            { username: email }
                        ]
                    } 
                });

                console.log('📊 Admin search result:', admin ? 'FOUND' : 'NOT FOUND');
                
                if (admin) {
                    console.log('🔍 Admin details:', {
                        id: admin.id,
                        email: admin.email,
                        username: admin.username,
                        first_name: admin.first_name,
                        last_name: admin.last_name,
                        role: admin.role,
                        is_active: admin.is_active,
                        hasCheckPassword: typeof admin.checkPassword,
                        passwordType: typeof admin.password,
                        passwordLength: admin.password ? admin.password.length : 'NULL'
                    });

                    if (admin.is_active) {
                        let isAdminPasswordValid = false;
                        
                        // Check if checkPassword method exists
                        if (typeof admin.checkPassword === 'function') {
                            console.log('🔑 Using checkPassword method');
                            isAdminPasswordValid = await admin.checkPassword(password);
                            console.log('✅ checkPassword result:', isAdminPasswordValid);
                        } else {
                            console.log('🔑 Using direct password comparison');
                            console.log('📥 Input password:', `"${password}"`);
                            console.log('💾 Stored password:', `"${admin.password}"`);
                            console.log('🔍 Exact match:', password === admin.password);
                            console.log('🔍 Length match:', password.length === admin.password.length);
                            
                            isAdminPasswordValid = password === admin.password;
                            console.log('✅ Direct comparison result:', isAdminPasswordValid);
                        }

                        if (isAdminPasswordValid) {
                            console.log('🎉 ADMIN LOGIN SUCCESSFUL!');
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

                            console.log('💾 Session created:', {
                                userSession: req.session.user,
                                adminSession: req.session.admin
                            });
                            
                            req.flash('success', `Welcome back, ${admin.first_name}!`);
                            console.log('🔄 Redirecting to /admin/dashboard');
                            return res.redirect('/admin/dashboard');
                        } else {
                            console.log('❌ ADMIN PASSWORD INVALID');
                        }
                    } else {
                        console.log('❌ ADMIN ACCOUNT INACTIVE');
                    }
                }
            } else {
                console.log('❌ AdminUser model not available in db');
            }

            // THEN CHECK CUSTOMER
            console.log('👤 === CHECKING CUSTOMER ===');
            let customer = await db.Customer.findOne({ where: { email } });
            console.log('📊 Customer search result:', customer ? 'FOUND' : 'NOT FOUND');
            
            if (customer) {
                console.log('🔍 Customer details:', {
                    id: customer.id,
                    email: customer.email,
                    name: customer.name,
                    is_active: customer.is_active,
                    hasCheckPassword: typeof customer.checkPassword
                });

                if (customer.is_active) {
                    const isPasswordValid = await customer.checkPassword(password);
                    console.log('✅ Customer password check:', isPasswordValid);
                    
                    if (isPasswordValid) {
                        console.log('🎉 CUSTOMER LOGIN SUCCESSFUL!');
                        await customer.update({ last_login: new Date() });
                        req.session.user = {
                            id: customer.id,
                            name: customer.name,
                            email: customer.email,
                            phone: customer.phone,
                            role: 'customer'
                        };
                        req.flash('success', `Welcome back, ${customer.name}!`);
                        console.log('🔄 Redirecting to /customer/dashboard');
                        return res.redirect('/customer/dashboard');
                    } else {
                        console.log('❌ CUSTOMER PASSWORD INVALID');
                    }
                } else {
                    console.log('❌ CUSTOMER ACCOUNT INACTIVE');
                }
            }

            // If we get here, login failed
            console.log('💀 === LOGIN FAILED ===');
            req.flash('error', 'Invalid email/username or password');
            return res.render('customer/login', {
                title: 'Login - Classic Cuts',
                user: null,
                formData: req.body
            });

        } catch (error) {
            console.error('💥 LOGIN ERROR:', error);
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