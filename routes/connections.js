const express = require('express');
const router = express.Router();

const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');

const {
    encrypt,
    decrypt
} = require('../services/encryption');

const {
    testConnection,
    getVPSStats
} = require('../services/ssh');

router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, type, label, vps_ip, status, created_at
             FROM connections
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [req.user.id]
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Failed to fetch connections'
        });
    }
});

router.post('/vps', authenticateToken, async (req, res) => {
    try {
        const {
            ip,
            username,
            password,
            label
        } = req.body;

        if (!ip || !username || !password) {
            return res.status(400).json({
                error: 'IP, username and password are required'
            });
        }

        const testResult = await testConnection(ip, username, password);

        if (!testResult.success) {
            return res.status(400).json({
                error: 'Connection failed',
                details: testResult.message,
                status: 'disconnected'
            });
        }

        const encryptedPassword = encrypt(password);

        const result = await pool.query(
            `INSERT INTO connections
             (user_id, type, label, vps_ip, vps_username, vps_password_encrypted, status)
             VALUES ($1, 'vps', $2, $3, $4, $5, 'connected')
             RETURNING id, type, label, vps_ip, status`,
            [
                req.user.id,
                label || 'My VPS',
                ip,
                username,
                encryptedPassword
            ]
        );

        res.status(201).json({
            message: 'VPS connected successfully',
            connection: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Failed to connect VPS'
        });
    }
});

router.post('/tickerall', authenticateToken, async (req, res) => {
    try {
        const {
            apiKey,
            apiToken,
            label
        } = req.body;

        if (!apiKey || !apiToken) {
            return res.status(400).json({
                error: 'API key and token are required'
            });
        }

        const encryptedKey = encrypt(apiKey);
        const encryptedToken = encrypt(apiToken);

        const result = await pool.query(
            `INSERT INTO connections
             (user_id, type, label, api_key_encrypted, api_token_encrypted, status)
             VALUES ($1, 'tickerall', $2, $3, $4, 'connected')
             RETURNING id, type, label, status`,
            [
                req.user.id,
                label || 'TickerAll API',
                encryptedKey,
                encryptedToken
            ]
        );

        res.status(201).json({
            message: 'TickerAll API connected successfully',
            connection: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Failed to connect TickerAll API'
        });
    }
});

router.get('/:id/stats', authenticateToken, async (req, res) => {
    try {
        const connResult = await pool.query(
            `SELECT *
             FROM connections
             WHERE id = $1 AND user_id = $2 AND type = 'vps'`,
            [req.params.id, req.user.id]
        );

        if (connResult.rows.length === 0) {
            return res.status(404).json({
                error: 'VPS connection not found'
            });
        }

        const conn = connResult.rows[0];

        const decryptedPassword = decrypt(conn.vps_password_encrypted);

        const stats = await getVPSStats(
            conn.vps_ip,
            conn.vps_username,
            decryptedPassword
        );

        if (stats.success) {
            await pool.query(
                `INSERT INTO vps_stats
                 (connection_id, cpu_usage, ram_usage, ram_total, network_usage)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    conn.id,
                    stats.cpu,
                    stats.ram_percent,
                    stats.ram_total,
                    'N/A'
                ]
            );
        }

        res.json(stats);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Failed to fetch VPS stats'
        });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query(
            `DELETE FROM connections
             WHERE id = $1 AND user_id = $2`,
            [req.params.id, req.user.id]
        );

        res.json({
            message: 'Connection deleted successfully'
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Failed to delete connection'
        });
    }
});

module.exports = router;
