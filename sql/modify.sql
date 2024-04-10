START TRANSACTION;
UPDATE appointments SET status = 'Fsds', version = version + 1 WHERE id = 2;  
COMMIT;
