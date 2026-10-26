
CREATE DATABASE IF NOT EXISTS MINI_UBER;
USE MINI_UBER;

-- 1. USER
CREATE TABLE IF NOT EXISTS `USER` (
    user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. USER_CREDENTIAL
CREATE TABLE IF NOT EXISTS USER_CREDENTIAL (
    user_id INT UNSIGNED PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    CONSTRAINT fk_credential_user
        FOREIGN KEY (user_id)
        REFERENCES `USER`(user_id)
        ON DELETE CASCADE
);

-- 3. DRIVER
CREATE TABLE IF NOT EXISTS DRIVER (
    user_id INT UNSIGNED PRIMARY KEY,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    status ENUM(
        'PENDING', 'AVAILABLE', 'ON_RIDE', 'OFFLINE', 'SUSPENDED'
    ) NOT NULL DEFAULT 'PENDING',

    CONSTRAINT fk_driver_user
        FOREIGN KEY (user_id)
        REFERENCES `USER`(user_id)
        ON DELETE CASCADE
);

-- 4. VEHICLE_TYPE
CREATE TABLE IF NOT EXISTS VEHICLE_TYPE (
    vehicle_type_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL UNIQUE
);

-- 5. VEHICLE
CREATE TABLE IF NOT EXISTS VEHICLE (
    vehicle_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    driver_user_id INT UNSIGNED NOT NULL,
    vehicle_type_id INT UNSIGNED NOT NULL,
    registration_number VARCHAR(30) NOT NULL UNIQUE,
    model VARCHAR(100) NOT NULL,

    CONSTRAINT fk_vehicle_driver
        FOREIGN KEY (driver_user_id)
        REFERENCES DRIVER(user_id),

    CONSTRAINT fk_vehicle_type
        FOREIGN KEY (vehicle_type_id)
        REFERENCES VEHICLE_TYPE(vehicle_type_id)
);

-- 6. LOCATION
CREATE TABLE IF NOT EXISTS LOCATION (
    location_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    address VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,

    CONSTRAINT chk_location_latitude
        CHECK (latitude BETWEEN -90 AND 90),

    CONSTRAINT chk_location_longitude
        CHECK (longitude BETWEEN -180 AND 180)
);

-- 7. RIDE
CREATE TABLE IF NOT EXISTS RIDE (
    ride_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    vehicle_id INT UNSIGNED NULL,
    requested_vehicle_type_id INT UNSIGNED NOT NULL,
    pickup_location_id INT UNSIGNED NOT NULL,
    drop_location_id INT UNSIGNED NOT NULL,
    request_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    start_time DATETIME NULL,
    end_time DATETIME NULL,
    fare DECIMAL(10, 2) NULL,
    status ENUM(
        'REQUESTED', 'ACCEPTED', 'ONGOING', 'COMPLETED', 'CANCELLED'
    ) NOT NULL DEFAULT 'REQUESTED',

    CONSTRAINT fk_ride_user
        FOREIGN KEY (user_id)
        REFERENCES `USER`(user_id),

    CONSTRAINT fk_ride_vehicle
        FOREIGN KEY (vehicle_id)
        REFERENCES VEHICLE(vehicle_id),

    CONSTRAINT fk_ride_requested_type
        FOREIGN KEY (requested_vehicle_type_id)
        REFERENCES VEHICLE_TYPE(vehicle_type_id),

    CONSTRAINT fk_ride_pickup
        FOREIGN KEY (pickup_location_id)
        REFERENCES LOCATION(location_id),

    CONSTRAINT fk_ride_drop
        FOREIGN KEY (drop_location_id)
        REFERENCES LOCATION(location_id),

    CONSTRAINT chk_ride_fare
        CHECK (fare IS NULL OR fare >= 0),

    INDEX idx_ride_user_time (user_id, request_time),
    INDEX idx_ride_status_type (status, requested_vehicle_type_id)
);

-- 8. PAYMENT
CREATE TABLE IF NOT EXISTS PAYMENT (
    payment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ride_id INT UNSIGNED NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('CASH', 'CARD', 'UPI', 'WALLET') NOT NULL,
    payment_status ENUM(
        'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'
    ) NOT NULL DEFAULT 'PENDING',
    transaction_id VARCHAR(255) NULL UNIQUE,
    payment_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_ride
        FOREIGN KEY (ride_id)
        REFERENCES RIDE(ride_id),

    CONSTRAINT chk_payment_amount
        CHECK (amount >= 0),

    INDEX idx_payment_ride (ride_id)
);

-- 9. RATING
CREATE TABLE IF NOT EXISTS RATING (
    rating_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ride_id INT UNSIGNED NOT NULL,
    rater_id INT UNSIGNED NOT NULL,
    rated_user_id INT UNSIGNED NOT NULL,
    rating TINYINT UNSIGNED NOT NULL,
    comment VARCHAR(1000) NULL,
    rating_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_rating_ride
        FOREIGN KEY (ride_id)
        REFERENCES RIDE(ride_id),

    CONSTRAINT fk_rating_rater
        FOREIGN KEY (rater_id)
        REFERENCES `USER`(user_id),

    CONSTRAINT fk_rating_rated_user
        FOREIGN KEY (rated_user_id)
        REFERENCES `USER`(user_id),

    CONSTRAINT uq_rating_per_rater
        UNIQUE (ride_id, rater_id),

    CONSTRAINT chk_rating_range
        CHECK (rating BETWEEN 1 AND 5)
);

-- 10. NOTIFICATION
CREATE TABLE IF NOT EXISTS NOTIFICATION (
    notification_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    type VARCHAR(50) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES `USER`(user_id)
        ON DELETE CASCADE,

    INDEX idx_notification_user_read (user_id, is_read)
);

-- 11. USER_SESSION
CREATE TABLE IF NOT EXISTS USER_SESSION (
    session_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at DATETIME NULL,

    CONSTRAINT fk_session_user
        FOREIGN KEY (user_id)
        REFERENCES `USER`(user_id)
        ON DELETE CASCADE,

    INDEX idx_session_user (user_id)
);
