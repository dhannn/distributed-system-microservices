-- DROP TRIGGER increment_version;
USE SeriousMD;

DELIMITER $$
CREATE TRIGGER increment_version BEFORE UPDATE ON Appointments
FOR EACH ROW BEGIN
    SET NEW.version = OLD.VERSION + 1;
END;
$$
DELIMITER ;
