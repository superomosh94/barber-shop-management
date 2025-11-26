const session = require('express-session');

const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'barber-shop-super-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict'
    },
    name: 'barberShop.sid'
};

// For production, you might want to use a session store like connect-redis
if (process.env.NODE_ENV === 'production') {
    // Configure production session store here
    console.log('Production session configuration loaded');
}

module.exports = sessionConfig;