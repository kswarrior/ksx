# KS Plugin Manager

Runtime plugin manager for Paper/Spigot/Bukkit. Load, unload, reload, enable, disable, download from raw URLs, check and apply updates, and fully remove plugins without restarting the server (best-effort).

## Features

- List all loaded plugins with state
- Plugin info (version, authors, commands, file)
- Load a jar from the `plugins` folder
- Unload a plugin (reflection-based deep cleanup)
- Reload (unload + load same jar)
- Enable / disable plugins
- Download and install from a raw URL (async, auto-load)
- Check updates from Modrinth, Hangar and Spigot (Spiget)
- Apply updates with a backup and automatic rollback
- Remove a plugin completely (unload + delete jar + config folder)
- Aliases: `/pm`, `/kspluginmanager`, `/kspm`, `/plugman`

## Commands

Permission: `kspluginmanager.use` (default OP)

| Command | Description |
| --- | --- |
| `/pm list` | List loaded plugins |
| `/pm info <plugin>` | Show plugin details |
| `/pm load <file.jar>` | Load jar from plugins folder |
| `/pm unload <plugin>` | Unload plugin from memory |
| `/pm reload <plugin>` | Unload and reload plugin |
| `/pm enable <plugin>` | Enable a disabled plugin |
| `/pm disable <plugin>` | Disable a plugin |
| `/pm install <url> [file.jar]` | Download raw jar and load |
| `/pm remove <plugin\|file.jar>` | Delete jar + config folder |
| `/pm check [plugin\|all]` | Check configured sources for updates |
| `/pm update <plugin>` | Download and apply an update with rollback |

## Configuration

`config.yml`:

```yaml
auto-update-check: false
update-interval-hours: 24
sources:
  - modrinth
  - hangar
  - spigot
updates:
  include-prerelease: false
  allow-incompatible: false
  max-download-size-mb: 100
  projects: {}
```

Pin a plugin to a source with `updates.projects`:

```yaml
updates:
  projects:
    EssentialsX: modrinth:essentialsx
    ViaVersion: hangar:ViaVersion
    SomePlugin: spigot:12345
```

Messages can be edited in `messages.yml` (prefix under `messages.prefix`).

## Build

```bash
mvn -DskipTests package
```

The shaded jar is written to `release/plugin/KSPluginManager-1.0.0.jar`.

Tests:

```bash
mvn test
```

## Notes

- Runtime unload/reload is best-effort; a full server restart is still the safest option for production.
- Update sources are tried in the configured order. Only exact name/slug matches are accepted unless a project is pinned.
- Automatic update checks only log available updates; they never install anything. Use `/pm update <plugin>`.
