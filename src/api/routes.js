const express = require('express');
const database = require('../database/db');

const router = express.Router();

router.get('/devices', async (req, res) => {
    try {
        const devices = await database.getAllDevices();
        res.json({
            success: true,
            count: devices.length,
            devices: devices
        });
    } catch (error) {
        console.error('Error fetching devices:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch devices'
        });
    }
});

router.get('/devices/active', async (req, res) => {
    try {
        const devices = await database.getActiveDevices();
        res.json({
            success: true,
            count: devices.length,
            devices: devices
        });
    } catch (error) {
        console.error('Error fetching active devices:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch active devices'
        });
    }
});

router.get('/devices/:device_id', async (req, res) => {
    try {
        const device = await database.getDeviceById(req.params.device_id);
        if (device) {
            res.json({
                success: true,
                device: device
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Device not found'
            });
        }
    } catch (error) {
        console.error('Error fetching device:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch device'
        });
    }
});

router.get('/devices/:device_id/logs', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const logs = await database.getDeviceLogs(req.params.device_id, limit);
        res.json({
            success: true,
            count: logs.length,
            logs: logs
        });
    } catch (error) {
        console.error('Error fetching device logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch device logs'
        });
    }
});

router.put('/devices/:device_id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({
                success: false,
                error: 'Status is required'
            });
        }

        const result = await database.updateDeviceStatus(req.params.device_id, status);
        res.json({
            success: true,
            message: 'Device status updated',
            changes: result.changes
        });
    } catch (error) {
        console.error('Error updating device status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update device status'
        });
    }
});

router.get('/stats', async (req, res) => {
    try {
        const allDevices = await database.getAllDevices();
        const activeDevices = await database.getActiveDevices();
        
        res.json({
            success: true,
            stats: {
                total_devices: allDevices.length,
                active_devices: activeDevices.length,
                inactive_devices: allDevices.length - activeDevices.length
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics'
        });
    }
});

module.exports = router;
