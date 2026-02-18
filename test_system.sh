#!/bin/bash

echo "========================================"
echo "Rahasam System Test Script"
echo "========================================"
echo ""

echo "Testing TCP Server (Port 2022)..."
echo ""

echo "Test 1: Sending JSON device data..."
echo '{"device_id": "sensor_001", "device_name": "Temperature Sensor", "device_type": "IoT", "temperature": 25.5, "humidity": 60}' | nc -w 1 localhost 2022
echo ""

sleep 1

echo "Test 2: Sending another device..."
echo '{"device_id": "sensor_002", "device_name": "Pressure Sensor", "device_type": "Industrial", "pressure": 101.3}' | nc -w 1 localhost 2022
echo ""

sleep 1

echo "Test 3: Sending plain text data..."
echo "Plain text message from device_003" | nc -w 1 localhost 2022
echo ""

sleep 1

echo "========================================"
echo "Testing API Endpoints..."
echo "========================================"
echo ""

echo "GET /api/stats"
curl -s http://localhost:3000/api/stats | python3 -m json.tool
echo ""

echo "GET /api/devices/active"
curl -s http://localhost:3000/api/devices/active | python3 -m json.tool
echo ""

echo "========================================"
echo "Test Complete!"
echo "========================================"
echo "Visit http://localhost:3000 to see the dashboard"
echo ""
