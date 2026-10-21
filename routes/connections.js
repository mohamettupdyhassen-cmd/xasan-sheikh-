const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { encrypt } = require('../services/encryption');
const { connect: sshConnect, disconnect } = require('../services/ssh');

// Get all connections for logged in user
router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, type, label, vps_ip, vps_username, status, created_at FROM connections WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json({ connections: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new connection
router.post('/', auth, async (req, res) => {
    try {
        const { type, label, vps_ip, vps_username, vps_password, api_key, api_token } = req.body;

        const encryptedPassword = vps_password ? encrypt(vps_password) : null;
        const encryptedApiKey = api_key ? encrypt(api_key) : null;
        const encryptedApiToken = api_token ? encrypt(api_token) : null;

        const result = await pool.query(
            `INSERT INTO connections (user_id, type, label, vps_ip, vps_username, vps_password_encrypted, api_key_encrypted, api_token_encrypted, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'disconnected') RETURNING id, type, label, status`,
            [req.user.id, type, label, vps_ip || null, vps_username || null, encryptedPassword, encryptedApiKey, encryptedApiToken]
        );

        res.json({ success: true, connection: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Connect / Test a connection
router.post('/:id/connect', auth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM connections WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Connection not found' });
        }

        const connection = result.rows[0];

        if (connection.type === 'vps') {
            const sshResult = await sshConnect(connection);

            if (sshResult.success) {
                await pool.query(
                    "UPDATE connections SET status = 'connected', updated_at = NOW() WHERE id = $1",
                    [id]
                );
                disconnect();
                return res.json({ success: true, status: 'connected' });
            } else {
                await pool.query(
                    "UPDATE connections SET status = 'disconnected', updated_at = NOW() WHERE id = $1",
                    [id]
                );
                return res.status(400).json({ success: false, error: sshResult.error });
            }
        } else {
            await pool.query(
                "UPDATE connections SET status = 'connected', updated_at = NOW() WHERE id = $1",
                [id]
            );
            return res.json({ success: true, status: 'connected' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete connection
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM connections WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
