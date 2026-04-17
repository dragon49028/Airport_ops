-- Default users (passwords are BCrypt encoded)
-- admin123, staff123, operator123
INSERT INTO users (username, password, email, role) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'admin@airport.com', 'ADMIN'),
('staff1', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQbQRWXOShAVpqX2T/Yf6Ku5.TFLK6', 'staff1@airport.com', 'STAFF'),
('operator1', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQbQRWXOShAVpqX2T/Yf6Ku5.TFLK6', 'operator1@airport.com', 'OPERATOR');

-- Aircraft
INSERT INTO aircraft (registration_number, model, airline, capacity, status, current_gate) VALUES
('VT-ANA', 'Boeing 737-800', 'Air India', 189, 'AT_GATE', 'A1'),
('VT-SIC', 'Airbus A320neo', 'IndiGo', 180, 'IN_FLIGHT', NULL),
('VT-JSO', 'Boeing 777-300ER', 'Jet Airways', 350, 'MAINTENANCE', 'B3'),
('VT-AXH', 'Airbus A321', 'Air India Express', 220, 'AVAILABLE', NULL),
('VT-GOA', 'ATR 72-600', 'SpiceJet', 70, 'AT_GATE', 'C2'),
('VT-BOM', 'Boeing 787-9', 'Vistara', 280, 'IN_FLIGHT', NULL),
('VT-DEL', 'Airbus A319', 'GoAir', 156, 'AVAILABLE', NULL),
('VT-HYD', 'Boeing 737 MAX 8', 'IndiGo', 189, 'AT_GATE', 'A4');

-- Flight Schedules
INSERT INTO flight_schedule (flight_number, aircraft_id, origin, destination, scheduled_arrival, scheduled_departure, status) VALUES
('AI-101', 1, 'DEL', 'BOM', DATEADD('HOUR', -2, NOW()), DATEADD('HOUR', 1, NOW()), 'ARRIVED'),
('6E-202', 2, 'BLR', 'DEL', DATEADD('HOUR', 1, NOW()), DATEADD('HOUR', 3, NOW()), 'IN_FLIGHT'),
('9W-303', 3, 'HYD', 'MAA', DATEADD('HOUR', -5, NOW()), DATEADD('HOUR', -1, NOW()), 'DELAYED'),
('IX-404', 4, 'COK', 'DEL', DATEADD('HOUR', 2, NOW()), DATEADD('HOUR', 4, NOW()), 'SCHEDULED'),
('SG-505', 5, 'DEL', 'GOI', DATEADD('HOUR', -1, NOW()), DATEADD('HOUR', 0, NOW()), 'ARRIVED'),
('UK-606', 6, 'BOM', 'LHR', DATEADD('HOUR', 3, NOW()), DATEADD('HOUR', 5, NOW()), 'SCHEDULED'),
('G8-707', 7, 'PNQ', 'DEL', DATEADD('HOUR', 4, NOW()), DATEADD('HOUR', 6, NOW()), 'SCHEDULED'),
('6E-808', 8, 'MAA', 'BLR', DATEADD('HOUR', 0, NOW()), DATEADD('HOUR', 2, NOW()), 'BOARDING');

-- Gate Assignments
INSERT INTO gate_assignment (gate_number, flight_schedule_id, assigned_time, release_time, status) VALUES
('A1', 1, DATEADD('HOUR', -3, NOW()), DATEADD('HOUR', 2, NOW()), 'ACTIVE'),
('B3', 3, DATEADD('HOUR', -6, NOW()), DATEADD('HOUR', 1, NOW()), 'ACTIVE'),
('C2', 5, DATEADD('HOUR', -2, NOW()), DATEADD('HOUR', 1, NOW()), 'ACTIVE'),
('A4', 8, DATEADD('HOUR', -1, NOW()), DATEADD('HOUR', 3, NOW()), 'ACTIVE'),
('B1', 4, DATEADD('HOUR', 1, NOW()), DATEADD('HOUR', 5, NOW()), 'SCHEDULED'),
('C3', 6, DATEADD('HOUR', 2, NOW()), DATEADD('HOUR', 6, NOW()), 'SCHEDULED');

-- Runway Slots
INSERT INTO runway_slot (runway_number, flight_schedule_id, slot_time, duration, slot_type, status) VALUES
('RWY-09L', 1, DATEADD('HOUR', -2, NOW()), 25, 'LANDING', 'COMPLETED'),
('RWY-27R', 2, DATEADD('HOUR', 1, NOW()), 30, 'TAKEOFF', 'SCHEDULED'),
('RWY-09L', 4, DATEADD('HOUR', 2, NOW()), 25, 'LANDING', 'SCHEDULED'),
('RWY-27R', 5, DATEADD('MINUTE', -30, NOW()), 30, 'TAKEOFF', 'COMPLETED'),
('RWY-09R', 6, DATEADD('HOUR', 5, NOW()), 35, 'TAKEOFF', 'SCHEDULED'),
('RWY-27L', 7, DATEADD('HOUR', 4, NOW()), 25, 'LANDING', 'SCHEDULED'),
('RWY-09L', 8, DATEADD('HOUR', 0, NOW()), 25, 'LANDING', 'IN_PROGRESS');

-- Baggage Manifests
INSERT INTO baggage_manifest (flight_schedule_id, baggage_count, priority_level, status, handling_team) VALUES
(1, 145, 'NORMAL', 'DELIVERED', 'Team Alpha'),
(3, 89, 'HIGH', 'PENDING', 'Team Beta'),
(5, 52, 'NORMAL', 'IN_PROGRESS', 'Team Gamma'),
(8, 167, 'URGENT', 'IN_PROGRESS', 'Team Alpha'),
(4, 210, 'NORMAL', 'PENDING', NULL),
(6, 280, 'HIGH', 'PENDING', NULL);

-- Refuel Requests
INSERT INTO refuel_request (flight_schedule_id, fuel_quantity, fuel_type, requested_time, status, assigned_crew) VALUES
(1, 15000.00, 'JET_A1', DATEADD('HOUR', -3, NOW()), 'COMPLETED', 'Crew R1'),
(3, 8500.00, 'JET_A1', DATEADD('HOUR', -1, NOW()), 'IN_PROGRESS', 'Crew R2'),
(4, 12000.00, 'JET_A1', DATEADD('HOUR', 1, NOW()), 'PENDING', NULL),
(6, 45000.00, 'JET_A1', DATEADD('HOUR', 2, NOW()), 'PENDING', NULL),
(7, 9500.00, 'JET_A1', DATEADD('HOUR', 3, NOW()), 'PENDING', NULL),
(8, 11000.00, 'JET_A1', NOW(), 'IN_PROGRESS', 'Crew R3');

-- Maintenance Clearances
INSERT INTO maintenance_clearance (aircraft_id, issue_description, severity, clearance_status, approved_by, reported_time) VALUES
(3, 'Engine 2 pressure drop detected during pre-flight check', 'CRITICAL', 'PENDING', NULL, DATEADD('HOUR', -5, NOW())),
(1, 'Minor hydraulic fluid leak in landing gear assembly', 'MINOR', 'CLEARED', 'Chief Engineer R. Kumar', DATEADD('HOUR', -4, NOW())),
(5, 'Cabin pressurization sensor calibration required', 'MODERATE', 'IN_REVIEW', NULL, DATEADD('HOUR', -2, NOW())),
(8, 'Routine 100-hour inspection completed', 'MINOR', 'CLEARED', 'Engineer S. Patel', DATEADD('DAY', -1, NOW())),
(2, 'APU startup delay — software update pending', 'MODERATE', 'IN_REVIEW', NULL, DATEADD('MINUTE', -90, NOW()));

-- Ground Staff
INSERT INTO ground_staff (staff_id, name, role, shift, current_assignment, status, phone) VALUES
('GS001', 'Rajesh Kumar', 'GATE_AGENT', 'DAY', 'Gate A1 - AI-101', 'BUSY', '+91-9876543210'),
('GS002', 'Priya Sharma', 'BAGGAGE_HANDLER', 'DAY', 'Flight AI-101 Baggage', 'BUSY', '+91-9876543211'),
('GS003', 'Amit Singh', 'REFUELING_TECH', 'DAY', 'Refuel 9W-303', 'BUSY', '+91-9876543212'),
('GS004', 'Sunita Patel', 'MAINTENANCE_CREW', 'DAY', 'Aircraft VT-JSO Inspection', 'BUSY', '+91-9876543213'),
('GS005', 'Vikram Nair', 'GATE_AGENT', 'EVENING', NULL, 'AVAILABLE', '+91-9876543214'),
('GS006', 'Deepa Menon', 'BAGGAGE_HANDLER', 'EVENING', NULL, 'AVAILABLE', '+91-9876543215'),
('GS007', 'Suresh Reddy', 'RAMP_AGENT', 'DAY', 'Gate C2 - SG-505', 'BUSY', '+91-9876543216'),
('GS008', 'Anita Gupta', 'OPERATIONS_SUPERVISOR', 'DAY', 'Terminal B Oversight', 'BUSY', '+91-9876543217'),
('GS009', 'Kiran Verma', 'REFUELING_TECH', 'NIGHT', NULL, 'AVAILABLE', '+91-9876543218'),
('GS010', 'Meera Iyer', 'MAINTENANCE_CREW', 'EVENING', NULL, 'AVAILABLE', '+91-9876543219');
