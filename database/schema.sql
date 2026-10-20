CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS connections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    label VARCHAR(100),
    vps_ip VARCHAR(100),
    vps_username VARCHAR(100),
    vps_password_encrypted TEXT,
    api_key_encrypted TEXT,
    api_token_encrypted TEXT,
    status VARCHAR(20) DEFAULT 'disconnected',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    connection_id INTEGER REFERENCES connections(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    deploy_type VARCHAR(20) NOT NULL,
    file_path TEXT,
    code_content TEXT,
    language VARCHAR(50),
    status VARCHAR(20) DEFAULT 'stopped',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    trade_type VARCHAR(10),
    open_price DECIMAL(15,5),
    close_price DECIMAL(15,5),
    profit_loss DECIMAL(15,2),
    status VARCHAR(20) DEFAULT 'open',
    opened_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    log_type VARCHAR(20) DEFAULT 'info',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vps_stats (
    id SERIAL PRIMARY KEY,
    connection_id INTEGER REFERENCES connections(id) ON DELETE CASCADE,
    cpu_usage DECIMAL(5,2),
    ram_usage DECIMAL(5,2),
    ram_total VARCHAR(20),
    network_usage VARCHAR(20),
    recorded_at TIMESTAMP DEFAULT NOW()
);
