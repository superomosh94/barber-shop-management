const { AdminUser, Appointment } = require('../../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

const userController = {
    // Show admin login form
    showAdminLogin: (req, res) => {
        res.render('admin/login', {
            title: 'Admin Login - Classic Cuts',
            layout: 'admin-layout'
        });
    },

    // Handle admin login
    adminLogin: async (req, res) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                req.flash('error', 'Username and password are required');
                return res.redirect('/admin/login');
            }

            const admin = await AdminUser.findOne({
                where: {
                    [Op.or]: [
                        { username: username.trim() },
                        { email: username.trim() }
                    ],
                    is_active: true
                }
            });

            if (!admin) {
                req.flash('error', 'Invalid username or password');
                return res.redirect('/admin/login');
            }

            const isPasswordValid = await admin.checkPassword(password);
            if (!isPasswordValid) {
                req.flash('error', 'Invalid username or password');
                return res.redirect('/admin/login');
            }

            // Update last login
            await admin.update({ last_login: new Date() });

            // Create admin session
            req.session.admin = {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                role: admin.role,
                first_name: admin.first_name,
                last_name: admin.last_name,
                permissions: admin.permissions
            };

            req.flash('success', `Welcome back, ${admin.first_name || admin.username}!`);
            res.redirect('/admin/dashboard');

        } catch (error) {
            console.error('Admin login error:', error);
            req.flash('error', 'Login failed. Please try again.');
            res.redirect('/admin/login');
        }
    },

    // Admin logout
    adminLogout: (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Admin logout error:', err);
                req.flash('error', 'Logout failed');
                return res.redirect('/admin/dashboard');
            }
            res.redirect('/admin/login');
        });
    },

    // Admin Management
    showAdmins: async (req, res) => {
        try {
            const admins = await AdminUser.findAll({
                order: [['created_at', 'DESC']]
            });

            // Calculate pending appointments count for sidebar
            const pendingAppointmentsCount = await Appointment.count({
                where: { status: 'pending' }
            });

            res.render('admin/admins', {
                title: 'Admin Management - Classic Cuts',
                layout: 'admin-layout',
                admin: req.session.admin,
                admins,
                pendingAppointmentsCount,
                currentPage: 'admins'
            });
        } catch (error) {
            console.error('Admin management error:', error);
            req.flash('error', 'Unable to load admin management');
            res.redirect('/admin/dashboard');
        }
    },

    // Get Admin Profile
    showProfile: async (req, res) => {
        try {
            const admin = await AdminUser.findByPk(req.session.admin.id);
            if (!admin) {
                req.flash('error', 'Admin not found');
                return res.redirect('/admin/dashboard');
            }

            // Calculate pending appointments count for sidebar
            const pendingAppointmentsCount = await Appointment.count({
                where: { status: 'pending' }
            });

            res.render('admin/profile', {
                title: 'My Profile - Classic Cuts',
                layout: 'admin-layout',
                admin: req.session.admin,
                adminData: admin,
                pendingAppointmentsCount,
                currentPage: 'profile',
                moment: require('moment')
            });
        } catch (error) {
            console.error('Profile error:', error);
            req.flash('error', 'Unable to load profile');
            res.redirect('/admin/dashboard');
        }
    },

    // Update Admin Profile
    updateProfile: async (req, res) => {
        try {
            const { first_name, last_name, email, current_password, new_password } = req.body;
            const adminId = req.session.admin.id;

            const admin = await AdminUser.findByPk(adminId);
            if (!admin) {
                return res.status(404).json({ success: false, error: 'Admin not found' });
            }

            // Update basic info
            await admin.update({
                first_name,
                last_name,
                email
            });

            // Update password if provided
            if (current_password && new_password) {
                const isCurrentPasswordValid = await admin.checkPassword(current_password);
                if (!isCurrentPasswordValid) {
                    return res.status(400).json({ success: false, error: 'Current password is incorrect' });
                }
                await admin.update({ password: new_password });
            }

            // Update session
            req.session.admin.first_name = first_name;
            req.session.admin.last_name = last_name;
            req.session.admin.email = email;

            res.json({
                success: true,
                message: 'Profile updated successfully'
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ success: false, error: 'Failed to update profile' });
        }
    },

    // Create new admin
    createAdmin: async (req, res) => {
        try {
            const { first_name, last_name, username, email, password, role, is_active, permissions } = req.body;

            // Check if username or email already exists
            const existingAdmin = await AdminUser.findOne({
                where: {
                    [Op.or]: [
                        { username: username.trim() },
                        { email: email.trim() }
                    ]
                }
            });

            if (existingAdmin) {
                return res.status(400).json({
                    success: false,
                    error: 'Username or email already exists'
                });
            }

            const admin = await AdminUser.create({
                first_name,
                last_name,
                username: username.trim(),
                email: email.trim(),
                password, // This will be hashed by the model hook
                role: role || 'admin',
                is_active: is_active === 'true',
                permissions: permissions || 'dashboard'
            });

            res.json({ success: true, message: 'Admin created successfully', data: admin });
        } catch (error) {
            console.error('Create admin API error:', error);
            res.status(500).json({ success: false, error: 'Failed to create admin' });
        }
    },

    updateAdminStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { is_active } = req.body;

            const admin = await AdminUser.findByPk(id);
            if (!admin) {
                return res.status(404).json({ success: false, error: 'Admin not found' });
            }

            await admin.update({ is_active });

            res.json({ success: true, message: 'Admin status updated successfully' });
        } catch (error) {
            console.error('Update admin status error:', error);
            res.status(500).json({ success: false, error: 'Failed to update admin status' });
        }
    },

    deleteAdmin: async (req, res) => {
        try {
            const { id } = req.params;

            // Prevent self-deletion
            if (parseInt(id) === req.session.admin.id) {
                return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
            }

            const admin = await AdminUser.findByPk(id);
            if (!admin) {
                return res.status(404).json({ success: false, error: 'Admin not found' });
            }

            await admin.destroy();
            res.json({ success: true, message: 'Admin deleted successfully' });
        } catch (error) {
            console.error('Delete admin API error:', error);
            res.status(500).json({ success: false, error: 'Failed to delete admin' });
        }
    }
};

module.exports = userController;
