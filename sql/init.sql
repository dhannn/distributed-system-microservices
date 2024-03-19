CREATE DATABASE IF NOT EXISTS SeriousMD;

USE SeriousMD;

CREATE TABLE IF NOT EXISTS Appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_name VARCHAR(255),
    doctor_name VARCHAR(255),
    region VARCHAR(8),
    appt_status VARCHAR(9)
);

