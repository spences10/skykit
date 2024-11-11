-- Store basic user profiles
CREATE TABLE
  users (
    did TEXT PRIMARY KEY,
    handle TEXT NOT NULL,
    display_name TEXT,
    description TEXT,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  );

-- Track follower history
CREATE TABLE
  follower_snapshots (
    id INTEGER PRIMARY KEY,
    user_did TEXT NOT NULL,
    follower_did TEXT NOT NULL,
    first_seen DATETIME NOT NULL,
    last_seen DATETIME NOT NULL,
    is_current BOOLEAN DEFAULT true,
    FOREIGN KEY (user_did) REFERENCES users (did),
    FOREIGN KEY (follower_did) REFERENCES users (did)
  );

-- Store post data
CREATE TABLE
  posts (
    uri TEXT PRIMARY KEY,
    user_did TEXT NOT NULL,
    text TEXT NOT NULL,
    indexed_at DATETIME NOT NULL,
    has_media BOOLEAN DEFAULT false,
    has_links BOOLEAN DEFAULT false,
    reply_parent TEXT,
    quote_uri TEXT,
    FOREIGN KEY (user_did) REFERENCES users (did)
  );

-- Track engagement metrics over time
CREATE TABLE
  post_metrics (
    id INTEGER PRIMARY KEY,
    post_uri TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    reposts_count INTEGER DEFAULT 0,
    recorded_at DATETIME NOT NULL,
    FOREIGN KEY (post_uri) REFERENCES posts (uri)
  );

-- Track user metrics over time
CREATE TABLE
  user_metrics (
    id INTEGER PRIMARY KEY,
    user_did TEXT NOT NULL,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    recorded_at DATETIME NOT NULL,
    FOREIGN KEY (user_did) REFERENCES users (did)
  );

-- Create indexes for better query performance
CREATE INDEX idx_follower_snapshots_user ON follower_snapshots (user_did, is_current);

CREATE INDEX idx_posts_user_time ON posts (user_did, indexed_at);

CREATE INDEX idx_post_metrics_time ON post_metrics (post_uri, recorded_at);

CREATE INDEX idx_user_metrics_time ON user_metrics (user_did, recorded_at);

