CREATE TABLE IF NOT EXISTS apps (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner TEXT NOT NULL,
  platform TEXT NOT NULL,
  version TEXT NOT NULL,
  download_url TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS app_downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_slug TEXT NOT NULL,
  version TEXT NOT NULL,
  platform TEXT NOT NULL,
  download_url TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  country TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (app_slug) REFERENCES apps(slug)
);

CREATE INDEX IF NOT EXISTS idx_app_downloads_app_created
  ON app_downloads (app_slug, created_at DESC);
