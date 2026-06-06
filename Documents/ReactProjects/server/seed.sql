CREATE DATABASE IF NOT EXISTS employee_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE employee_db;

CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(150),
  contact_number VARCHAR(50),
  salary DECIMAL(10,2) DEFAULT 0.00,
  address TEXT,
  dob DATE,
  age INT,
  image_url VARCHAR(255) DEFAULT 'default.png',
  department_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO departments (name) VALUES
('Sales'),
('Marketing'),
('Human Resources'),
('Engineering'),
('Finance'),
('Customer Support'),
('Operations'),
('Legal'),
('IT'),
('R&D');

INSERT IGNORE INTO employees (first_name, last_name, email, contact_number, salary, address, dob, age, image_url, department_id) VALUES
('John', 'Doe', 'john.doe@example.com', '(555) 123-4567', 50000.00, '123 Main St, City, State, ZIP', '1993-06-15', 30, 'default.png', 1),
('Jane', 'Smith', 'jane.smith@example.com', '(555) 234-5678', 65000.00, '456 Oak Ave, City, State, ZIP', '1987-04-22', 36, 'default.png', 2),
('Alice', 'Johnson', 'alice.johnson@example.com', '(555) 345-6789', 55000.00, '789 Pine Rd, City, State, ZIP', '1990-09-05', 33, 'default.png', 3);
