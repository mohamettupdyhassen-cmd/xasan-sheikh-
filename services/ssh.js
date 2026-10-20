const { NodeSSH } = require('node-ssh');

async function testConnection(ip, username, password) {
    const ssh = new NodeSSH();

    try {
        await ssh.connect({
            host: ip,
            username: username,
            password: password,
            readyTimeout: 10000
        });

        ssh.dispose();

        return {
            success: true,
            message: 'Connection successful'
        };

    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

async function getVPSStats(ip, username, password) {
    const ssh = new NodeSSH();

    try {
        await ssh.connect({
            host: ip,
            username: username,
            password: password,
            readyTimeout: 10000
        });

        const cpuResult = await ssh.execCommand(
            "top -bn1 | grep 'Cpu(s)' | awk '{print $2}'"
        );

        const ramResult = await ssh.execCommand(
            "free -m | awk 'NR==2{printf \"%.2f %s %s\", $3*100/$2, $3, $2}'"
        );

        ssh.dispose();

        const ramParts = ramResult.stdout.split(' ');

        return {
            success: true,
            cpu: parseFloat(cpuResult.stdout) || 0,
            ram_percent: parseFloat(ramParts[0]) || 0,
            ram_used: ramParts[1] ? `${ramParts[1]}MB` : '0MB',
            ram_total: ramParts[2] ? `${ramParts[2]}MB` : '0MB'
        };

    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

async function deployCode(ip, username, password, localFilePath, remoteFilePath) {
    const ssh = new NodeSSH();

    try {
        await ssh.connect({
            host: ip,
            username: username,
            password: password
        });

        await ssh.putFile(localFilePath, remoteFilePath);

        const folderPath = remoteFilePath.substring(0, remoteFilePath.lastIndexOf('/'));

        const result = await ssh.execCommand(
            `cd ${folderPath} && nohup python3 ${remoteFilePath} > output.log 2>&1 &`
        );

        ssh.dispose();

        return {
            success: true,
            result
        };

    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

module.exports = {
    testConnection,
    getVPSStats,
    deployCode
};
