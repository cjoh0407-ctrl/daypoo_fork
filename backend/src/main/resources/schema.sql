-- Init PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(50) UNIQUE NOT NULL,
    equipped_title_id BIGINT,
    level INT DEFAULT 1,
    exp BIGINT DEFAULT 0,
    points BIGINT DEFAULT 0,
    role VARCHAR(20) DEFAULT 'ROLE_USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Title items catalog
CREATE TABLE IF NOT EXISTS titles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    required_level INT DEFAULT 1,
    price BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User titles intersection (Inventory)
CREATE TABLE IF NOT EXISTS user_titles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title_id BIGINT NOT NULL,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (title_id) REFERENCES titles(id)
);

-- Toilets (Public data & User Reports)
CREATE TABLE IF NOT EXISTS toilets (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    location geometry(Point, 4326) NOT NULL, -- PostGIS Spatial type
    open_hours VARCHAR(100),
    is_24h BOOLEAN DEFAULT FALSE,
    is_unisex BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for fast geospatial queries
CREATE INDEX IF NOT EXISTS idx_toilets_location ON toilets USING GIST(location);

-- Poo Records (Authentication logs)
CREATE TABLE IF NOT EXISTS poo_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    toilet_id BIGINT NOT NULL,
    bristol_scale INT CHECK (bristol_scale BETWEEN 1 AND 7),
    color VARCHAR(20),
    condition_tags TEXT,
    diet_tags TEXT,
    region_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (toilet_id) REFERENCES toilets(id)
);

-- Support Inquiries
CREATE TABLE IF NOT EXISTS inquiries (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    answer TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    answered_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
