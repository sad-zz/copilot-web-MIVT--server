const net = require('net');
const database = require('../database/db');

class TCPServer {
    constructor(port = 2022) {
        this.port = port;
        this.server = null;
        this.activeConnections = new Map();
    }

    start() {
        this.server = net.createServer((socket) => {
            this.handleConnection(socket);
        });

        this.server.listen(this.port, '0.0.0.0', () => {
            console.log(`TCP Server listening on port ${this.port}`);
        });

        this.server.on('error', (err) => {
            console.error('TCP Server error:', err);
        });
    }

    handleConnection(socket) {
        const clientId = `${socket.remoteAddress}:${socket.remotePort}`;
        console.log(`New connection from ${clientId}`);

        this.activeConnections.set(clientId, socket);

        socket.on('data', async (data) => {
            try {
                await this.processData(data, socket);
            } catch (error) {
                console.error('Error processing data:', error);
                socket.write('ERROR: Failed to process data\n');
            }
        });

        socket.on('end', () => {
            console.log(`Connection closed: ${clientId}`);
            this.activeConnections.delete(clientId);
        });

        socket.on('error', (err) => {
            console.error(`Socket error for ${clientId}:`, err);
            this.activeConnections.delete(clientId);
        });

        socket.write('Welcome to Rahasam Device Management System\n');
    }

    async processData(data, socket) {
        const dataStr = data.toString().trim();
        console.log(`Received data: ${dataStr}`);

        try {
            const parsedData = JSON.parse(dataStr);
            
            const deviceData = {
                device_id: parsedData.device_id || parsedData.id || `device_${Date.now()}`,
                ip_address: socket.remoteAddress,
                port: socket.remotePort,
                device_name: parsedData.device_name || parsedData.name || 'Unknown Device',
                device_type: parsedData.device_type || parsedData.type || 'Generic',
                data: dataStr
            };

            await database.insertOrUpdateDevice(deviceData);
            await database.insertDataLog(deviceData.device_id, dataStr);

            socket.write(JSON.stringify({
                status: 'success',
                message: 'Data received and stored',
                device_id: deviceData.device_id,
                timestamp: new Date().toISOString()
            }) + '\n');

        } catch (jsonError) {
            const deviceData = {
                device_id: `device_${socket.remoteAddress}_${socket.remotePort}`,
                ip_address: socket.remoteAddress,
                port: socket.remotePort,
                device_name: 'Unknown Device',
                device_type: 'Generic',
                data: dataStr
            };

            await database.insertOrUpdateDevice(deviceData);
            await database.insertDataLog(deviceData.device_id, dataStr);

            socket.write(JSON.stringify({
                status: 'success',
                message: 'Data received and stored (non-JSON format)',
                device_id: deviceData.device_id,
                timestamp: new Date().toISOString()
            }) + '\n');
        }
    }

    getActiveConnections() {
        return Array.from(this.activeConnections.keys());
    }

    stop() {
        if (this.server) {
            this.activeConnections.forEach((socket) => {
                socket.end();
            });
            this.activeConnections.clear();

            this.server.close(() => {
                console.log('TCP Server stopped');
            });
        }
    }
}

module.exports = TCPServer;
