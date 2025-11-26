// Customer authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    
    req.flash('error', 'Please log in to access this page');
    res.redirect('/login');
};

// Admin authentication middleware - UPDATED to check both session formats
const requireAdminAuth = (req, res, next) => {
    // Check both session formats for admin users
    const adminUser = req.session.admin || req.session.user;
    
    console.log('🔒 Admin auth check:', {
        hasAdminSession: !!req.session.admin,
        hasUserSession: !!req.session.user,
        userRole: req.session.user?.role,
        adminRole: req.session.admin?.role
    });
    
    if (!adminUser) {
        req.flash('error', 'Please log in as administrator');
        return res.redirect('/login');
    }
    
    // Check if user has admin role (from either session format)
    const isAdmin = adminUser.role === 'admin' || 
                   adminUser.role === 'super_admin' || 
                   adminUser.role === 'manager';
    
    if (!isAdmin) {
        req.flash('error', 'Access denied. Admin privileges required.');
        return res.redirect('/customer/dashboard');
    }
    
    next();
};

// Check if user is already logged in (for login/register pages)
const redirectIfAuthenticated = (req, res, next) => {
    if (req.session.user) {
        // Check if it's an admin user logged in through customer login
        if (req.session.user.role && 
            (req.session.user.role === 'admin' || 
             req.session.user.role === 'super_admin' || 
             req.session.user.role === 'manager')) {
            return res.redirect('/admin/dashboard');
        }
        return res.redirect('/customer/dashboard');
    }
    next();
};

// Check if admin is already logged in - UPDATED to check both session formats
const redirectIfAdminAuthenticated = (req, res, next) => {
    const adminUser = req.session.admin || req.session.user;
    
    if (adminUser && 
        (adminUser.role === 'admin' || 
         adminUser.role === 'super_admin' || 
         adminUser.role === 'manager')) {
        return res.redirect('/admin/dashboard');
    }
    
    next();
};

// Role-based access control for admin - UPDATED to check both session formats
const requireRole = (roles = []) => {
    return (req, res, next) => {
        const adminUser = req.session.admin || req.session.user;
        
        if (!adminUser) {
            req.flash('error', 'Access denied. Please log in.');
            return res.redirect('/login');
        }

        // Check if user has admin role
        const isAdmin = adminUser.role === 'admin' || 
                       adminUser.role === 'super_admin' || 
                       adminUser.role === 'manager';
        
        if (!isAdmin) {
            req.flash('error', 'Access denied. Admin privileges required.');
            return res.redirect('/customer/dashboard');
        }

        if (roles.length && !roles.includes(adminUser.role)) {
            req.flash('error', 'Insufficient permissions to access this resource.');
            return res.redirect('/admin/dashboard');
        }

        next();
    };
};

// Check permission middleware - UPDATED to check both session formats
const requirePermission = (resource, action) => {
    return (req, res, next) => {
        const adminUser = req.session.admin || req.session.user;
        
        if (!adminUser) {
            req.flash('error', 'Access denied. Please log in.');
            return res.redirect('/login');
        }

        // Check if user has admin role
        const isAdmin = adminUser.role === 'admin' || 
                       adminUser.role === 'super_admin' || 
                       adminUser.role === 'manager';
        
        if (!isAdmin) {
            req.flash('error', 'Access denied. Admin privileges required.');
            return res.redirect('/customer/dashboard');
        }

        // Super admin has all permissions
        if (adminUser.role === 'super_admin') {
            return next();
        }

        const hasPermission = adminUser.permissions && 
                            adminUser.permissions[resource] && 
                            adminUser.permissions[resource].includes(action);

        if (!hasPermission) {
            req.flash('error', 'You do not have permission to perform this action.');
            return res.redirect('/admin/dashboard');
        }

        next();
    };
};

// Optional: Add a debug middleware to check sessions
const debugSession = (req, res, next) => {
    console.log('🔍 Session Debug:', {
        user: req.session.user,
        admin: req.session.admin,
        sessionId: req.sessionID
    });
    next();
};

module.exports = {
    requireAuth,
    requireAdminAuth,
    redirectIfAuthenticated,
    redirectIfAdminAuthenticated,
    requireRole,
    requirePermission,
    debugSession
};