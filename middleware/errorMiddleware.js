// Global error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error Stack:', err.stack);
    
    // Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
        const messages = err.errors.map(error => error.message);
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(422).json({
                success: false,
                errors: messages
            });
        }
        req.flash('error', messages);
        return res.redirect('back');
    }
    
    // Sequelize unique constraint errors
    if (err.name === 'SequelizeUniqueConstraintError') {
        const messages = err.errors.map(error => {
            if (error.path === 'email') {
                return 'Email already exists';
            }
            return 'Duplicate entry found';
        });
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(422).json({
                success: false,
                errors: messages
            });
        }
        req.flash('error', messages);
        return res.redirect('back');
    }
    
    // Sequelize foreign key constraint errors
    if (err.name === 'SequelizeForeignKeyConstraintError') {
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(400).json({
                success: false,
                error: 'Related record not found'
            });
        }
        req.flash('error', 'Related record not found');
        return res.redirect('back');
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }
        req.flash('error', 'Invalid authentication token');
        return res.redirect('/login');
    }
    
    // Default error
    const errorMessage = process.env.NODE_ENV === 'production' 
        ? 'Something went wrong!' 
        : err.message;
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(err.status || 500).json({
            success: false,
            error: errorMessage
        });
    }
    
    // Render error page
    res.status(err.status || 500).render('errors/500', {
        title: 'Server Error',
        error: process.env.NODE_ENV === 'production' ? {} : err
    });
};

// 404 Not Found middleware
const notFoundHandler = (req, res, next) => {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(404).json({
            success: false,
            error: 'Endpoint not found'
        });
    }
    
    res.status(404).render('errors/404', {
        title: 'Page Not Found',
        url: req.url
    });
};

module.exports = {
    errorHandler,
    notFoundHandler
};