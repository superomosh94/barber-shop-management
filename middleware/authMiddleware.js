// Customer authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    
    req.flash('error', 'Please log in to access this page');
    res.redirect('/login');
};

// Admin authentication middleware
const requireAdminAuth = (req, res, next) => {
    if (req.session.admin) {
        return next();
    }
    
    req.flash('error', 'Please log in as administrator');
    res.redirect('/admin/login');
};

// Check if user is already logged in (for login/register pages)
const redirectIfAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return res.redirect('/customer/dashboard');
    }
    next();
};

// Check if admin is already logged in
const redirectIfAdminAuthenticated = (req, res, next) => {
    if (req.session.admin) {
        return res.redirect('/admin/dashboard');
    }
    next();
};

// Role-based access control for admin
const requireRole = (roles = []) => {
    return (req, res, next) => {
        if (!req.session.admin) {
            req.flash('error', 'Access denied. Please log in.');
            return res.redirect('/admin/login');
        }

        if (roles.length && !roles.includes(req.session.admin.role)) {
            req.flash('error', 'Insufficient permissions to access this resource.');
            return res.redirect('/admin/dashboard');
        }

        next();
    };
};

// Check permission middleware
const requirePermission = (resource, action) => {
    return (req, res, next) => {
        if (!req.session.admin) {
            req.flash('error', 'Access denied. Please log in.');
            return res.redirect('/admin/login');
        }

        if (req.session.admin.role === 'super_admin') {
            return next();
        }

        const hasPermission = req.session.admin.permissions && 
                            req.session.admin.permissions[resource] && 
                            req.session.admin.permissions[resource].includes(action);

        if (!hasPermission) {
            req.flash('error', 'You do not have permission to perform this action.');
            return res.redirect('/admin/dashboard');
        }

        next();
    };
};

module.exports = {
    requireAuth,
    requireAdminAuth,
    redirectIfAuthenticated,
    redirectIfAdminAuthenticated,
    requireRole,
    requirePermission
};