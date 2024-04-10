-- DROP TRIGGER increment_version;

CREATE TRIGGER increment_version BEFORE UPDATE ON Appointments
FOR EACH ROW BEGIN
    SET NEW.version = OLD.VERSION + 1;
END;
