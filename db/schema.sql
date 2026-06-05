CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Super Admin', 'Admin', 'Content Uploader', 'User') NOT NULL DEFAULT 'User',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(255) NOT NULL,
    resource_id VARCHAR(255) NULL,
    details JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sources (
    source_id VARCHAR(255) PRIMARY KEY,
    source_type ENUM('epaper', 'portal', 'social_x', 'social_instagram', 'social_meta', 'social_linkedin') NOT NULL,
    name VARCHAR(255) NOT NULL,
    configuration JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articles (
    article_id VARCHAR(255) PRIMARY KEY,
    source_type VARCHAR(100) NOT NULL,
    source_id VARCHAR(255) NOT NULL,
    title VARCHAR(1000) NULL,
    subtitle TEXT NULL,
    author VARCHAR(255) NULL,
    body_text LONGTEXT NULL,
    language VARCHAR(50) DEFAULT 'hi',
    matched_keywords JSON NULL,
    claims JSON NULL,
    narrative_tone VARCHAR(100) NULL,
    purpose_judgment TEXT NULL,
    beneficiary_tags JSON NULL,
    status VARCHAR(50) DEFAULT 'queued',
    raw_file_url TEXT NULL,
    credibility_score FLOAT NULL,
    logic_evaluations JSON NULL,
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,
    FOREIGN KEY (source_id) REFERENCES sources(source_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS keywords (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text VARCHAR(255) NOT NULL UNIQUE,
    synonyms JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS keyword_logics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    keyword_id INT NOT NULL,
    criteria TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (keyword_id) REFERENCES keywords(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS keyword_clusters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    keyword_ids JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
