CREATE INDEX IF NOT EXISTS idx_app_downloads_app_version
  ON app_downloads (app_slug, version);
