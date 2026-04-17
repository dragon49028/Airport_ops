-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'OPERATOR',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS aircraft (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    registration_number VARCHAR(20) NOT NULL UNIQUE,
    model VARCHAR(100) NOT NULL,
    airline VARCHAR(100),
    capacity INT,
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    current_gate VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flight_schedule (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    flight_number VARCHAR(20) NOT NULL UNIQUE,
    aircraft_id BIGINT,
    origin VARCHAR(10),
    destination VARCHAR(10),
    scheduled_arrival TIMESTAMP,
    scheduled_departure TIMESTAMP,
    actual_arrival TIMESTAMP,
    actual_departure TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aircraft_id) REFERENCES aircraft(id)
);

CREATE TABLE IF NOT EXISTS gate (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    gate_number VARCHAR(10) NOT NULL UNIQUE,
    terminal VARCHAR(10) NOT NULL,
    capacity INT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gate_assignment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    gate_number VARCHAR(10) NOT NULL,
    flight_schedule_id BIGINT,
    assigned_time TIMESTAMP,
    release_time TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (flight_schedule_id) REFERENCES flight_schedule(id)
);

CREATE TABLE IF NOT EXISTS runway_slot (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    runway_number VARCHAR(10) NOT NULL,
    flight_schedule_id BIGINT,
    slot_time TIMESTAMP NOT NULL,
    duration INT NOT NULL DEFAULT 30,
    slot_type VARCHAR(20) NOT NULL DEFAULT 'LANDING',
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (flight_schedule_id) REFERENCES flight_schedule(id)
);

CREATE TABLE IF NOT EXISTS baggage_manifest (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    flight_schedule_id BIGINT,
    baggage_count INT NOT NULL DEFAULT 0,
    priority_level VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    handling_team VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (flight_schedule_id) REFERENCES flight_schedule(id)
);

CREATE TABLE IF NOT EXISTS refuel_request (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    flight_schedule_id BIGINT,
    fuel_quantity DECIMAL(10,2) NOT NULL,
    fuel_type VARCHAR(30) NOT NULL DEFAULT 'JET_A1',
    requested_time TIMESTAMP NOT NULL,
    completed_time TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    assigned_crew VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (flight_schedule_id) REFERENCES flight_schedule(id)
);

CREATE TABLE IF NOT EXISTS maintenance_clearance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    aircraft_id BIGINT,
    issue_description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'MINOR',
    clearance_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    approved_by VARCHAR(100),
    reported_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cleared_time TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (aircraft_id) REFERENCES aircraft(id)
);

CREATE TABLE IF NOT EXISTS ground_staff (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    staff_id VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    shift VARCHAR(20) NOT NULL DEFAULT 'DAY',
    current_assignment VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
