const express = require('express');
const router = express.Router();

// Home route
router.get('/', (req, res) => {
    res.render('customer/home', {
        title: 'Classic Cuts Barber Shop',
        user: req.session.user
    });
});

module.exports = router;
