-- Indexes
CREATE INDEX idx_room_number ON core_room(room_number);
CREATE INDEX idx_user_email ON core_user(email);
CREATE INDEX idx_booking_dates ON core_booking(check_in_date, check_out_date);

-- Views
CREATE VIEW v_available_rooms AS
SELECT room_number, room_type, price
FROM core_room
WHERE status = 'available';

CREATE VIEW v_active_bookings AS
SELECT b.id, u.username, r.room_number, b.check_in_date, b.check_out_date
FROM core_booking b
JOIN core_user u ON u.id = b.user_id
JOIN core_room r ON r.id = b.room_id
WHERE b.booking_status IN ('confirmed', 'checked_in');

-- Stored Procedure (MySQL example)
DELIMITER $$
CREATE PROCEDURE sp_calculate_total(IN p_room_id INT, IN p_check_in DATE, IN p_check_out DATE)
BEGIN
  DECLARE nightly_rate DECIMAL(10,2);
  DECLARE nights INT;
  SELECT price INTO nightly_rate FROM core_room WHERE id = p_room_id;
  SET nights = DATEDIFF(p_check_out, p_check_in);
  SELECT nightly_rate * nights AS total_amount;
END$$
DELIMITER ;

-- Trigger (MySQL example)
DELIMITER $$
CREATE TRIGGER trg_booking_after_insert
AFTER INSERT ON core_booking
FOR EACH ROW
BEGIN
  UPDATE core_room
  SET status = 'booked'
  WHERE id = NEW.room_id;
END$$
DELIMITER ;

-- Transaction example
START TRANSACTION;
  INSERT INTO core_booking (user_id, room_id, check_in_date, check_out_date, total_amount, booking_status, created_at)
  VALUES (1, 1, '2026-03-01', '2026-03-03', 5000.00, 'confirmed', NOW());

  UPDATE core_room SET status = 'booked' WHERE id = 1;

  INSERT INTO core_payment (booking_id, payment_date, amount, payment_method, payment_status)
  VALUES (LAST_INSERT_ID(), NOW(), 5000.00, 'card', 'paid');
COMMIT;
