const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = null;
    }

    initialize() {
        return new Promise((resolve, reject) => {
            const dbPath = path.join(__dirname, '../../rahasam.db');
            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('Database connected successfully');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    createTables() {
        return new Promise((resolve, reject) => {
            const createDevicesTable = `
                CREATE TABLE IF NOT EXISTS devices (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    device_id TEXT UNIQUE NOT NULL,
                    ip_address TEXT NOT NULL,
                    port INTEGER NOT NULL,
                    device_name TEXT,
                    device_type TEXT,
                    status TEXT DEFAULT 'active',
                    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                    first_connected DATETIME DEFAULT CURRENT_TIMESTAMP,
                    data TEXT
                )
            `;

            const createDataLogsTable = `
                CREATE TABLE IF NOT EXISTS data_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    device_id TEXT NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    data TEXT NOT NULL,
                    FOREIGN KEY (device_id) REFERENCES devices(device_id)
                )
            `;

            this.db.run(createDevicesTable, (err) => {
                if (err) {
                    console.error('Error creating devices table:', err);
                    reject(err);
                } else {
                    console.log('Devices table created/verified');
                    this.db.run(createDataLogsTable, (err) => {
                        if (err) {
                            console.error('Error creating data_logs table:', err);
                            reject(err);
                        } else {
                            console.log('Data logs table created/verified');
                            resolve();
                        }
                    });
                }
            });
        });
    }

    insertOrUpdateDevice(deviceData) {
        return new Promise((resolve, reject) => {
            const { device_id, ip_address, port, device_name, device_type, data } = deviceData;
            
            const query = `
                INSERT INTO devices (device_id, ip_address, port, device_name, device_type, data, last_seen)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(device_id) DO UPDATE SET
                    ip_address = excluded.ip_address,
                    port = excluded.port,
                    device_name = COALESCE(excluded.device_name, device_name),
                    device_type = COALESCE(excluded.device_type, device_type),
                    data = excluded.data,
                    last_seen = CURRENT_TIMESTAMP,
                    status = 'active'
            `;

            this.db.run(query, [device_id, ip_address, port, device_name, device_type, data], function(err) {
                if (err) {
                    console.error('Error inserting/updating device:', err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, device_id });
                }
            });
        });
    }

    insertDataLog(device_id, data) {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO data_logs (device_id, data) VALUES (?, ?)`;
            
            this.db.run(query, [device_id, data], function(err) {
                if (err) {
                    console.error('Error inserting data log:', err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
                }
            });
        });
    }

    getAllDevices() {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM devices ORDER BY last_seen DESC`;
            
            this.db.all(query, [], (err, rows) => {
                if (err) {
                    console.error('Error fetching devices:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    getActiveDevices() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM devices 
                WHERE status = 'active' 
                AND datetime(last_seen) > datetime('now', '-5 minutes')
                ORDER BY last_seen DESC
            `;
            
            this.db.all(query, [], (err, rows) => {
                if (err) {
                    console.error('Error fetching active devices:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    getDeviceById(device_id) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM devices WHERE device_id = ?`;
            
            this.db.get(query, [device_id], (err, row) => {
                if (err) {
                    console.error('Error fetching device:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    getDeviceLogs(device_id, limit = 100) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM data_logs 
                WHERE device_id = ? 
                ORDER BY timestamp DESC 
                LIMIT ?
            `;
            
            this.db.all(query, [device_id, limit], (err, rows) => {
                if (err) {
                    console.error('Error fetching device logs:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    updateDeviceStatus(device_id, status) {
        return new Promise((resolve, reject) => {
            const query = `UPDATE devices SET status = ? WHERE device_id = ?`;
            
            this.db.run(query, [status, device_id], function(err) {
                if (err) {
                    console.error('Error updating device status:', err);
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    markInactiveDevices() {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE devices 
                SET status = 'inactive' 
                WHERE datetime(last_seen) < datetime('now', '-5 minutes')
                AND status = 'active'
            `;
            
            this.db.run(query, [], function(err) {
                if (err) {
                    console.error('Error marking inactive devices:', err);
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                        reject(err);
                    } else {
                        console.log('Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = new Database();
