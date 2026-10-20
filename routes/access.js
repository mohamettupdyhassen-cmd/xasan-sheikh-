const express = require('express');
const router = express.Router();

const SITE_PASSWORD = '1213';

router.post('/verify', (req, res) => {
    const { password } = req.body;

    if (password === SITE_PASSWORD) {
        res.cookie('site_access', 'granted', {
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000
        });
        return res.json({ success: true });
    }

    res.status(401).json({ success: false, error: 'Password qaldan' });
});

module.exports = router;
