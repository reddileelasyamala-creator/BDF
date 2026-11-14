-- Lab 4: Registration, Login and JWT Authentication
-- Database Initialization Script
-- Target Table: users

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password TEXT NOT NULL
);

-- Index on username for fast lookup during login and registration checks
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
