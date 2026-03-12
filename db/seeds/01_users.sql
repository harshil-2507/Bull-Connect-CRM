-- seed/01_users.sql

INSERT INTO users (name, username, password_hash, role, phone, email)
VALUES
-- Admin
('Ronak Shah', 'ronak', '$2b$10$hash', 'ADMIN', '9876500001', 'ronak@bull.com'),

-- Managers
('Harshil Andhariya', 'harshil', '$2b$10$hash', 'MANAGER', '9876500002', 'harshil@bull.com'),
('Karan Patel', 'karan', '$2b$10$hash', 'MANAGER', '9876500003', 'karan@bull.com'),

-- Telecallers (10)
('Rajesh Patel','tele_rajesh','$2b$10$hash','TELECALLER','9876510001','rajesh@bull.com'),
('Priya Singh','tele_priya','$2b$10$hash','TELECALLER','9876510002','priya@bull.com'),
('Amit Kumar','tele_amit','$2b$10$hash','TELECALLER','9876510003','amit@bull.com'),
('Rakesh Joshi','tele_rakesh','$2b$10$hash','TELECALLER','9876510004','rakesh@bull.com'),
('Vikram Sharma','tele_vikram','$2b$10$hash','TELECALLER','9876510005','vikram@bull.com'),
('Deepak Yadav','tele_deepak','$2b$10$hash','TELECALLER','9876510006','deepak@bull.com'),
('Sunil Chauhan','tele_sunil','$2b$10$hash','TELECALLER','9876510007','sunil@bull.com'),
('Neha Gupta','tele_neha','$2b$10$hash','TELECALLER','9876510008','neha@bull.com'),
('Pooja Verma','tele_pooja','$2b$10$hash','TELECALLER','9876510009','pooja@bull.com'),
('Ritu Singh','tele_ritu','$2b$10$hash','TELECALLER','9876510010','ritu@bull.com'),

-- Field Managers
('Mahesh Patel','field_mgr1','$2b$10$hash','FIELD_MANAGER','9876520001','mahesh@bull.com'),
('Dharmesh Shah','field_mgr2','$2b$10$hash','FIELD_MANAGER','9876520002','dharmesh@bull.com'),

-- Field Executives (20 sample)
('Amit Chauhan','field_exec1','$2b$10$hash','FIELD_EXEC','9876530001','amit.c@bull.com'),
('Ravi Solanki','field_exec2','$2b$10$hash','FIELD_EXEC','9876530002','ravi@bull.com'),
('Jay Patel','field_exec3','$2b$10$hash','FIELD_EXEC','9876530003','jay@bull.com');