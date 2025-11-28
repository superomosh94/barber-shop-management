// Required imports
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('connect-flash');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const methodOverride = require('method-override');
const path = require('path');
require('dotenv').config();

// Import database connection
const { sequelize } = require('./models');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(methodOverride('_method')); 

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for now to avoid breaking inline scripts/styles
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout'); // Default layout

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'barber-shop-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(flash());

// Global variables for views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.admin = req.session.admin || null;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentUrl = req.url;
    res.locals.moment = require('moment');
    next();
});

// Import routes
try {
    const authRoutes = require('./routes/authRoutes');
    const appointmentRoutes = require('./routes/appointmentRoutes');
    const serviceRoutes = require('./routes/serviceRoutes');
    const barberRoutes = require('./routes/barberRoutes');
    const ratingRoutes = require('./routes/ratingRoutes');
    const adminRoutes = require('./routes/adminRoutes');
    const customerRoutes = require('./routes/customerRoutes');
    const indexRoutes = require('./routes/indexRoutes');

    // Use routes
    app.use('/', indexRoutes);
    app.use('/auth', authRoutes);
    app.use('/appointments', appointmentRoutes);
    app.use('/services', serviceRoutes);
    app.use('/barbers', barberRoutes);
    app.use('/ratings', ratingRoutes);
    app.use('/admin', adminRoutes);
    app.use('/customer', customerRoutes);

    console.log('✅ All routes loaded successfully');
} catch (error) {
    console.error('❌ Error loading routes:', error.message);
    process.exit(1);
}

// Error handling middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
app.use(notFoundHandler);
app.use(errorHandler);

// Database sync and server start
sequelize.sync({ force: false })
    .then(() => {
        console.log('✅ Database synchronized successfully');
        app.listen(PORT, () => {
            console.log(`🚀 Barber Shop Management System running on port ${PORT}`);
            console.log(`📍 Visit: http://localhost:${PORT}`);
            console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    })
    .catch(err => {
        console.error('❌ Database synchronization failed:', err);
    });

module.exports = app;