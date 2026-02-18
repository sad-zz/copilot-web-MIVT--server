const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const database = require('./src/database/db');
const TCPServer = require('./src/tcp-server/server');
const apiRoutes = require('./src/api/routes');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 3000;
const TCP_PORT = process.env.TCP_PORT || 2022;

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'src/public')));

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/public/index.html'));
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        tcp_port: TCP_PORT,
        http_port: HTTP_PORT
    });
});

async function startServer() {
    try {
        console.log('='.repeat(60));
        console.log('🔐 Starting Rahasam Device Management System');
        console.log('='.repeat(60));

        await database.initialize();
        console.log('✅ Database initialized successfully');

        const tcpServer = new TCPServer(TCP_PORT);
        tcpServer.start();
        console.log(`✅ TCP Server started on port ${TCP_PORT}`);

        setInterval(async () => {
            try {
                await database.markInactiveDevices();
            } catch (error) {
                console.error('Error marking inactive devices:', error);
            }
        }, 60000);

        app.listen(HTTP_PORT, () => {
            console.log(`✅ HTTP Server started on port ${HTTP_PORT}`);
            console.log('='.repeat(60));
            console.log(`📊 Dashboard: http://localhost:${HTTP_PORT}`);
            console.log(`🔌 TCP Listener: Port ${TCP_PORT}`);
            console.log(`📡 API Endpoint: http://localhost:${HTTP_PORT}/api`);
            console.log('='.repeat(60));
            console.log('System is ready to receive device connections!');
            console.log('='.repeat(60));
        });

        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down gracefully...');
            tcpServer.stop();
            await database.close();
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
