# Rahasam Device Management System

A comprehensive device management system that stores information sent to IP server port 2022 in a database and provides a web dashboard to display active devices.

## Features

- **TCP Server**: Listens on port 2022 for incoming device connections
- **Data Storage**: Stores all device information in SQLite database
- **Device Tracking**: Monitors active/inactive device status
- **Web Dashboard**: Beautiful, real-time dashboard to view all devices
- **REST API**: Full API for device management and querying
- **Auto-Detection**: Automatically detects and stores device information

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm

### Setup

1. Clone the repository:
```bash
git clone https://github.com/sad-zz/copilot-web-MIVT--server.git
cd copilot-web-MIVT--server
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

## Usage

### Starting the System

```bash
npm start
```

The system will start:
- **TCP Server** on port 2022 (for device connections)
- **HTTP Server** on port 3000 (for web dashboard and API)

### Accessing the Dashboard

Open your browser and navigate to:
```
http://localhost:3000
```

The dashboard displays:
- Total number of devices
- Active devices count
- Inactive devices count
- Detailed device list with status

### Connecting Devices to Port 2022

Devices can send data to the TCP server on port 2022. The system accepts both JSON and plain text formats.

#### JSON Format (Recommended):
```bash
echo '{"device_id": "sensor_001", "device_name": "Temperature Sensor", "device_type": "IoT", "temperature": 25.5}' | nc localhost 2022
```

#### Plain Text Format:
```bash
echo "Device data from sensor_001" | nc localhost 2022
```

### API Endpoints

#### Get All Devices
```
GET /api/devices
```

#### Get Active Devices Only
```
GET /api/devices/active
```

#### Get Specific Device
```
GET /api/devices/:device_id
```

#### Get Device Logs
```
GET /api/devices/:device_id/logs?limit=100
```

#### Update Device Status
```
PUT /api/devices/:device_id/status
Body: { "status": "active" }
```

#### Get System Statistics
```
GET /api/stats
```

#### Health Check
```
GET /health
```

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│  TCP Server     │◄────────│  Devices/Sensors │
│  (Port 2022)    │         │  Send Data       │
└────────┬────────┘         └──────────────────┘
         │
         │ Store Data
         ▼
┌─────────────────┐
│  SQLite DB      │
│  - devices      │
│  - data_logs    │
└────────┬────────┘
         │
         │ Query Data
         ▼
┌─────────────────┐         ┌──────────────────┐
│  REST API       │────────►│  Web Dashboard   │
│  (Port 3000)    │         │  (Browser UI)    │
└─────────────────┘         └──────────────────┘
```

## Database Schema

### Devices Table
```sql
CREATE TABLE devices (
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
);
```

### Data Logs Table
```sql
CREATE TABLE data_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    data TEXT NOT NULL,
    FOREIGN KEY (device_id) REFERENCES devices(device_id)
);
```

## Configuration

Environment variables can be set to customize the system:

- `HTTP_PORT`: Web server port (default: 3000)
- `TCP_PORT`: TCP server port (default: 2022)

Example:
```bash
HTTP_PORT=8080 TCP_PORT=2022 npm start
```

## Device Status Management

- Devices are marked as **active** when they send data
- Devices are automatically marked as **inactive** if they haven't sent data for 5 minutes
- The system checks for inactive devices every 60 seconds

## Testing the System

### Test with netcat (nc):
```bash
# Send JSON data
echo '{"device_id": "test_device", "device_name": "Test Device", "device_type": "Sensor"}' | nc localhost 2022

# Send plain text
echo "Hello from device" | nc localhost 2022
```

### Test with telnet:
```bash
telnet localhost 2022
# Then type your data and press Enter
```

### Test with curl (API):
```bash
# Get all devices
curl http://localhost:3000/api/devices

# Get active devices
curl http://localhost:3000/api/devices/active

# Get statistics
curl http://localhost:3000/api/stats
```

## Troubleshooting

### Port Already in Use
If port 2022 or 3000 is already in use, you can change the ports:
```bash
HTTP_PORT=8080 TCP_PORT=2023 npm start
```

### Database Issues
The SQLite database file (`rahasam.db`) is created automatically. If you need to reset:
```bash
rm rahasam.db
npm start
```

### Connection Issues
- Ensure firewall allows connections on ports 2022 and 3000
- For remote connections, bind to 0.0.0.0 (already configured)

## Future Enhancements

- User authentication and authorization
- Device groups and categories
- Real-time notifications and alerts
- Data analytics and visualization
- Export data to CSV/JSON
- Device command sending capability
- Multi-protocol support (MQTT, CoAP, etc.)

## License

ISC

## Support

For issues and questions, please open an issue on the GitHub repository.

