const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const connectionsRoutes = require('./routes/connections');
const accessRoutes = require('./routes/access');
const runMigrations = require('./database/migrate');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function getCookie(req, name) {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(';').map(c => c.trim());
    for (const c of cookies) {
        const [key, value] = c.split('=');
        if (key === name) return value;
    }
    return null;
}

app.use('/api/access', accessRoutes);

app.get('/access', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'access.html'));
});

app.use((req, res, next) => {
    if (req.path.startsWith('/css') || req.path.startsWith('/js') || req.path === '/access') {
        return next();
    }

    const access = getCookie(req, 'site_access');
    if (access === 'granted') {
        return next();
    }

    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: 'Access denied' });
    }

    return res.redirect('/access');
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/connections', connectionsRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

runMigrations().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
});
