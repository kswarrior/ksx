INSERT INTO apps (slug, name, owner, platform, version, download_url)
VALUES (
  'ks-portal',
  'KS Portal',
  'KS Warrior',
  'android',
  '1.5.0',
  'https://github.com/kswarrior/opencode/raw/refs/heads/main/ks-apps/browser/android/release/ks-portal_1.5.0.apk'
)
ON CONFLICT(slug) DO UPDATE SET
  name = excluded.name,
  owner = excluded.owner,
  platform = excluded.platform,
  version = excluded.version,
  download_url = excluded.download_url,
  updated_at = datetime('now');
