const { NodeSSH } = require('node-ssh');
const { decrypt } = require('./encryption');

async function connect(connection) {
    const ssh = new NodeSSH();
    try {
        const decryptedPassword = decrypt(connection.vps_password_encrypted);

        await ssh.connect({
            host: connection.vps_ip,
            username: connection.vps_username,
            password: decryptedPassword,
            readyTimeout: 20000
        });

        return { success: true, ssh };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function executeCommand(ssh, command) {
    try {
        const result = await ssh.execCommand(command);
        return {
            success: true,
            stdout: result.stdout,
            stderr: result.stderr
        };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

function disconnect(ssh) {
    if (ssh && ssh.dispose) {
        ssh.dispose();
    }
}

module.exports = { connect, executeCommand, disconnect };
