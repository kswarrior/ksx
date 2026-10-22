INSERT INTO apps (slug, name, owner, platform, version, download_url)
VALUES (
  'ks-client',
  'KS Client',
  'KS Warrior',
  'bedrock',
  'V3',
  'https://www.mediafire.com/file/o78xzmld09b5nw9/KS_Client_V3.mcpack/file'
)
ON CONFLICT(slug) DO UPDATE SET
  name = excluded.name,
  owner = excluded.owner,
  platform = excluded.platform,
  version = excluded.version,
  download_url = excluded.download_url,
  updated_at = datetime('now');
