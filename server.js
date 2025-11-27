const express = require('express');
const session = require('express-session');
const flash = require('express-flash');
const path = require('path');
const methodOverride = require('method-override');
const { sequelize } = require('./models');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(methodOverride('_method'));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

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

    // Use routes
    app.use('/', authRoutes);
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

// Home route - moved before booking routes for better organization
app.get('/', (req, res) => {
    res.render('customer/home', { 
        title: 'Classic Cuts Barber Shop',
        user: req.session.user 
    });
});

// Update the booking route in server.js
app.get('/book-appointment', async (req, res) => {
    try {
        if (!req.session.user) {
            req.flash('error', 'Please login to book an appointment');
            return res.redirect('/auth/login');
        }

        // Import models
        const { Service, Barber } = require('./models');
        
        // Fetch available services and barbers with CORRECT column names
        const [services, barbers] = await Promise.all([
            Service.findAll({
                where: { is_active: true },
                attributes: ['id', 'name', 'price', 'duration', 'description', 'category'],
                order: [['name', 'ASC']]
            }),
            Barber.findAll({
                where: { is_active: true },
                attributes: ['id', 'name', 'specialty', 'experience', 'bio', 'image', 'email', 'phone'], // Changed specialization to specialty
                order: [['name', 'ASC']]
            })
        ]);

        res.render('customer/booking', {
            title: 'Book Appointment - Classic Cuts',
            services: services || [],
            barbers: barbers || [],
            user: req.session.user,
            currentPage: 'booking'
        });

    } catch (error) {
        console.error('Booking page error:', error);
        req.flash('error', 'Unable to load booking page. Please try again.');
        res.redirect('/customer/dashboard');
    }
});

// Redirect /booking to /book-appointment for consistency
app.get('/booking', (req, res) => {
    res.redirect('/book-appointment');
});

// Error handling middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

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