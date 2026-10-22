export type BotAuth = "offline" | "microsoft";

export type BotConfig = {
  host: string;
  port: number;
  username: string;
  owners: string[];
  auth: BotAuth;
  version: string;
  prefix: string;
  reconnectDelay: number;
  autoEat: boolean;
  eatThreshold: number;
  antiAfkJump: boolean;
  jumpInterval: number;
  antiAfkWalk: boolean;
  walkInterval: number;
  viewDistance: number;
};

export type BotCommand = {
  command: string;
  description: string;
};

export const DEFAULT_BOT_CONFIG: BotConfig = {
  host: "localhost",
  port: 25565,
  username: "KSBot",
  owners: ["YourMinecraftName"],
  auth: "offline",
  version: "",
  prefix: "!",
  reconnectDelay: 5,
  autoEat: true,
  eatThreshold: 15,
  antiAfkJump: true,
  jumpInterval: 45,
  antiAfkWalk: true,
  walkInterval: 60,
  viewDistance: 12,
};

export const BOT_COMMANDS: BotCommand[] = [
  { command: "help", description: "List every available command." },
  { command: "follow <player>", description: "Follow a player until stopped." },
  { command: "come", description: "Walk to the owner or a named player." },
  { command: "guard", description: "Follow the owner and attack nearby hostile mobs." },
  { command: "stopguard", description: "Stop guard mode." },
  { command: "stop", description: "Cancel the current action and clear movement." },
  { command: "attack <player>", description: "Chase and attack a player." },
  { command: "huntmobs", description: "Hunt hostile mobs within 32 blocks." },
  { command: "mine <block>", description: "Find and mine a nearby block by name." },
  { command: "equip", description: "Equip the best armor and weapon in inventory." },
  { command: "totem", description: "Move a totem of undying to the off-hand." },
];

const HOSTILE_MOBS = [
  "zombie",
  "zombie_villager",
  "husk",
  "drowned",
  "skeleton",
  "stray",
  "bogged",
  "spider",
  "cave_spider",
  "creeper",
  "enderman",
  "witch",
  "pillager",
  "vindicator",
  "evoker",
  "ravager",
  "slime",
  "magma_cube",
  "phantom",
  "blaze",
  "ghast",
  "guardian",
  "elder_guardian",
  "shulker",
  "silverfish",
  "endermite",
  "vex",
  "wither_skeleton",
  "piglin_brute",
  "hoglin",
  "zoglin",
  "warden",
  "breeze",
  "wither",
];

const FOODS = [
  "cooked_beef",
  "cooked_porkchop",
  "cooked_mutton",
  "cooked_chicken",
  "cooked_rabbit",
  "cooked_cod",
  "cooked_salmon",
  "bread",
  "baked_potato",
  "golden_carrot",
  "golden_apple",
  "enchanted_golden_apple",
  "apple",
  "carrot",
  "melon_slice",
  "sweet_berries",
  "glow_berries",
  "mushroom_stew",
  "rabbit_stew",
  "beetroot_soup",
];

function clampInt(value: number, fallback: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function normalizeBotConfig(input: BotConfig): BotConfig {
  const owners = input.owners.map((name) => name.trim()).filter(Boolean);
  if (owners.length === 0) owners.push("YourMinecraftName");

  return {
    host: input.host.trim() || "localhost",
    port: clampInt(input.port, 25565, 1, 65535),
    username: input.username.trim() || "KSBot",
    owners,
    auth: input.auth === "microsoft" ? "microsoft" : "offline",
    version: input.version.trim(),
    prefix: input.prefix.trim() || "!",
    reconnectDelay: clampInt(input.reconnectDelay, 5, 0, 3600),
    autoEat: input.autoEat,
    eatThreshold: clampInt(input.eatThreshold, 15, 1, 20),
    antiAfkJump: input.antiAfkJump,
    jumpInterval: clampInt(input.jumpInterval, 45, 5, 3600),
    antiAfkWalk: input.antiAfkWalk,
    walkInterval: clampInt(input.walkInterval, 60, 5, 3600),
    viewDistance: clampInt(input.viewDistance, 12, 2, 32),
  };
}

export function generateBotScript(input: BotConfig): string {
  const config = normalizeBotConfig(input);
  const runtimeConfig = {
    host: config.host,
    port: config.port,
    username: config.username,
    owners: config.owners,
    auth: config.auth,
    version: config.version || null,
    viewDistance: config.viewDistance,
    prefix: config.prefix,
    reconnectDelay: config.reconnectDelay,
    autoEat: config.autoEat,
    eatThreshold: config.eatThreshold,
    antiAfkJump: config.antiAfkJump,
    jumpInterval: config.jumpInterval,
    antiAfkWalk: config.antiAfkWalk,
    walkInterval: config.walkInterval,
  };

  return `const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')

const CONFIG = ${JSON.stringify(runtimeConfig, null, 2)}

const HOSTILE_MOBS = new Set(${JSON.stringify(HOSTILE_MOBS, null, 2)})
const FOODS = new Set(${JSON.stringify(FOODS, null, 2)})
const ARMOR_SLOTS = [
  ['head', '_helmet', 5],
  ['torso', '_chestplate', 6],
  ['legs', '_leggings', 7],
  ['feet', '_boots', 8]
]
const CONTROLS = ['forward', 'back', 'left', 'right', 'jump', 'sprint', 'sneak']
const HELP = ${JSON.stringify(BOT_COMMANDS.map((item) => `${item.command} - ${item.description}`), null, 2)}

let bot = null
let timers = []
let followName = null
let guardMode = false
let huntMode = false
let attackName = null
let reconnectTimer = null
let eating = false
let lastNoFoodLog = 0

function log(...args) {
  console.log('[' + new Date().toISOString() + ']', ...args)
}

function say(message) {
  try {
    if (bot) bot.chat(String(message))
  } catch {}
}

function isOwner(username) {
  const name = String(username).toLowerCase()
  return CONFIG.owners.some((owner) => owner.toLowerCase() === name)
}

function resolvePlayer(name) {
  const wanted = String(name || '').toLowerCase()
  if (!wanted || !bot) return null
  const username = Object.keys(bot.players).find((key) => key.toLowerCase() === wanted)
  return username ? { username, player: bot.players[username] } : null
}

function playerEntity(name) {
  const found = resolvePlayer(name)
  return found && found.player.entity ? found.player.entity : null
}

function clearGoal() {
  try {
    if (bot && bot.pathfinder) {
      bot.pathfinder.stop()
      bot.pathfinder.setGoal(null)
    }
  } catch {}
}

function stopControls() {
  if (!bot) return
  for (const control of CONTROLS) {
    try {
      bot.setControlState(control, false)
    } catch {}
  }
}

function resetModes() {
  followName = null
  guardMode = false
  huntMode = false
  attackName = null
  clearGoal()
  stopControls()
  try {
    if (bot) bot.stopDigging()
  } catch {}
}

function nearestEntity(position, names, maxDistance) {
  let best = null
  let bestDistance = maxDistance
  for (const entity of Object.values(bot.entities)) {
    if (!entity || entity === bot.entity || !entity.position || !entity.name) continue
    if (!names.has(entity.name)) continue
    const distance = entity.position.distanceTo(position)
    if (distance < bestDistance) {
      best = entity
      bestDistance = distance
    }
  }
  return best
}

function engage(entity) {
  if (!entity || !entity.position) return false
  const distance = bot.entity.position.distanceTo(entity.position)
  if (distance <= 3.4) {
    try {
      bot.lookAt(entity.position.offset(0, (entity.height || 1.6) * 0.8, 0), true)
      bot.attack(entity)
    } catch {}
  } else {
    try {
      bot.pathfinder.setGoal(new goals.GoalFollow(entity, 1.5), true)
    } catch {}
  }
  return true
}

function combatTick() {
  if (!bot || !bot.entity || !bot.pathfinder) return

  if (attackName) {
    const target = playerEntity(attackName)
    if (!target) {
      say(attackName + ' is not visible.')
      attackName = null
      clearGoal()
      return
    }
    engage(target)
    return
  }

  if (guardMode) {
    const owner = playerEntity(CONFIG.owners[0])
    const anchor = owner || bot.entity
    const hostile = nearestEntity(anchor.position, HOSTILE_MOBS, 14)
    if (hostile) {
      engage(hostile)
      return
    }
    if (owner) {
      try {
        bot.pathfinder.setGoal(new goals.GoalFollow(owner, 3), true)
      } catch {}
    }
    return
  }

  if (followName) {
    const target = playerEntity(followName)
    if (!target) {
      say(followName + ' is not visible.')
      followName = null
      clearGoal()
      return
    }
    try {
      bot.pathfinder.setGoal(new goals.GoalFollow(target, 2), true)
    } catch {}
    return
  }

  if (huntMode) {
    const hostile = nearestEntity(bot.entity.position, HOSTILE_MOBS, 32)
    if (hostile) {
      engage(hostile)
      return
    }
    huntMode = false
    clearGoal()
    say('No hostile mobs nearby.')
  }
}

async function autoEat() {
  if (!CONFIG.autoEat || eating || !bot || !bot.entity) return
  if (bot.food > CONFIG.eatThreshold) return
  const food = bot.inventory.items().find((item) => FOODS.has(item.name))
  if (!food) {
    if (Date.now() - lastNoFoodLog > 60000) {
      lastNoFoodLog = Date.now()
      log('No food in inventory.')
    }
    return
  }
  eating = true
  try {
    await bot.equip(food, 'hand')
    await bot.consume()
  } catch (error) {
    log('Auto-eat failed:', error.message)
  } finally {
    eating = false
  }
}

function startLoops() {
  stopLoops()
  timers.push(setInterval(() => {
    try {
      combatTick()
    } catch (error) {
      log('Combat loop error:', error.message)
    }
  }, 800))
  timers.push(setInterval(() => {
    autoEat()
  }, 2000))

  if (CONFIG.antiAfkJump) {
    timers.push(setInterval(() => {
      if (!bot || !bot.entity || followName || guardMode || huntMode || attackName) return
      try {
        bot.setControlState('jump', true)
        setTimeout(() => {
          try {
            if (bot) bot.setControlState('jump', false)
          } catch {}
        }, 300)
      } catch {}
    }, Math.max(5, CONFIG.jumpInterval) * 1000))
  }

  if (CONFIG.antiAfkWalk) {
    timers.push(setInterval(() => {
      if (!bot || !bot.entity || followName || guardMode || huntMode || attackName) return
      try {
        bot.look(Math.random() * Math.PI * 2, 0, true)
        bot.setControlState('forward', true)
        setTimeout(() => {
          try {
            if (bot) bot.setControlState('forward', false)
          } catch {}
        }, 500)
      } catch {}
    }, Math.max(5, CONFIG.walkInterval) * 1000))
  }
}

function stopLoops() {
  for (const timer of timers) clearInterval(timer)
  timers = []
}

function sendHelp() {
  let message = 'Commands:'
  for (const entry of HELP) {
    const next = message + (message === 'Commands:' ? ' ' : ' | ') + CONFIG.prefix + entry
    if (next.length > 250) {
      say(message)
      message = CONFIG.prefix + entry
    } else {
      message = next
    }
  }
  if (message) say(message)
}

function itemTier(name) {
  const order = ['netherite_', 'diamond_', 'iron_', 'chainmail_', 'golden_', 'leather_']
  const index = order.findIndex((prefix) => name.indexOf(prefix) === 0)
  return index === -1 ? 0 : order.length - index
}

async function equipBestGear() {
  if (!bot) return
  let equipped = 0
  const items = bot.inventory.items()

  for (const [slot, suffix, slotId] of ARMOR_SLOTS) {
    const candidates = items.filter((item) => item.name.endsWith(suffix))
    if (candidates.length === 0) continue
    candidates.sort((a, b) => itemTier(b.name) - itemTier(a.name))
    const best = candidates[0]
    const current = bot.inventory.slots[slotId]
    if (current && itemTier(current.name) >= itemTier(best.name)) continue
    try {
      await bot.equip(best, slot)
      equipped += 1
    } catch (error) {
      log('Armor equip failed:', error.message)
    }
  }

  const weapons = items.filter((item) => item.name.endsWith('_sword') || item.name.endsWith('_axe'))
  if (weapons.length > 0) {
    weapons.sort((a, b) => itemTier(b.name) - itemTier(a.name))
    const best = weapons[0]
    if (!bot.heldItem || itemTier(bot.heldItem.name) < itemTier(best.name)) {
      try {
        await bot.equip(best, 'hand')
        equipped += 1
      } catch (error) {
        log('Weapon equip failed:', error.message)
      }
    }
  }

  say(equipped > 0 ? 'Equipped best gear.' : 'No better gear found.')
}

async function equipTotem() {
  if (!bot) return
  const totem = bot.inventory.items().find((item) => item.name === 'totem_of_undying')
  if (!totem) {
    say('No totem of undying in inventory.')
    return
  }
  const offhand = bot.inventory.slots[45]
  if (offhand && offhand.name === 'totem_of_undying') {
    say('Totem is already equipped.')
    return
  }
  try {
    await bot.equip(totem, 'off-hand')
    say('Totem equipped.')
  } catch (error) {
    say('Could not equip totem: ' + error.message)
  }
}

async function mineBlock(rawName) {
  if (!rawName) {
    say('Usage: ' + CONFIG.prefix + 'mine <block>')
    return
  }
  if (!bot || !bot.registry || !bot.registry.blocksByName) {
    say('Block registry is not ready.')
    return
  }
  const name = rawName.toLowerCase().replace('minecraft:', '')
  const block = bot.registry.blocksByName[name]
  if (!block) {
    say('Unknown block: ' + name)
    return
  }
  const target = bot.findBlock({ matching: block.id, maxDistance: 32 })
  if (!target) {
    say('No ' + name + ' within 32 blocks.')
    return
  }
  say('Mining ' + name + '...')
  try {
    await bot.pathfinder.goto(new goals.GoalNear(target.position.x, target.position.y, target.position.z, 2))
    await bot.dig(target)
    say('Mined ' + name + '.')
  } catch (error) {
    say('Could not mine ' + name + ': ' + error.message)
  }
}

async function handleChat(username, message) {
  if (!bot || !message || username === bot.username) return
  if (!isOwner(username)) return
  if (message.indexOf(CONFIG.prefix) !== 0) return

  const parts = message.slice(CONFIG.prefix.length).trim().split(' ').filter(Boolean)
  const command = (parts.shift() || '').toLowerCase()
  const arg = parts[0]
  if (!command) return

  if (command === 'help') {
    sendHelp()
    return
  }
  if (command === 'stop') {
    resetModes()
    say('Stopped.')
    return
  }
  if (command === 'come') {
    const targetName = arg || CONFIG.owners[0]
    const target = playerEntity(targetName)
    if (!target) {
      say('Player not found or not visible: ' + targetName)
      return
    }
    resetModes()
    try {
      bot.pathfinder.setGoal(new goals.GoalNear(target.position.x, target.position.y, target.position.z, 2))
      say('Coming to ' + targetName + '.')
    } catch {
      say('Could not path to ' + targetName + '.')
    }
    return
  }
  if (command === 'follow') {
    const found = resolvePlayer(arg)
    if (!found || !found.player.entity) {
      say('Player not found or not visible: ' + (arg || ''))
      return
    }
    resetModes()
    followName = found.username
    try {
      bot.pathfinder.setGoal(new goals.GoalFollow(found.player.entity, 2), true)
    } catch {}
    say('Following ' + found.username + '.')
    return
  }
  if (command === 'guard') {
    resetModes()
    guardMode = true
    say('Guarding ' + CONFIG.owners[0] + '.')
    return
  }
  if (command === 'stopguard') {
    guardMode = false
    clearGoal()
    stopControls()
    say('Stopped guarding.')
    return
  }
  if (command === 'attack') {
    const found = resolvePlayer(arg)
    if (!found || !found.player.entity) {
      say('Player not found or not visible: ' + (arg || ''))
      return
    }
    resetModes()
    attackName = found.username
    say('Attacking ' + found.username + '.')
    return
  }
  if (command === 'huntmobs') {
    resetModes()
    huntMode = true
    say('Hunting hostile mobs.')
    return
  }
  if (command === 'mine') {
    resetModes()
    await mineBlock(arg)
    return
  }
  if (command === 'equip') {
    resetModes()
    await equipBestGear()
    return
  }
  if (command === 'totem') {
    resetModes()
    await equipTotem()
    return
  }
  say('Unknown command. Use ' + CONFIG.prefix + 'help.')
}

function createBot() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  const options = {
    host: CONFIG.host,
    port: CONFIG.port,
    username: CONFIG.username,
    auth: CONFIG.auth,
    viewDistance: CONFIG.viewDistance
  }
  if (CONFIG.version) options.version = CONFIG.version

  log('Connecting to ' + CONFIG.host + ':' + CONFIG.port + ' as ' + CONFIG.username)
  bot = mineflayer.createBot(options)
  bot.loadPlugin(pathfinder)

  bot.once('spawn', () => {
    const movements = new Movements(bot)
    movements.canDig = false
    bot.pathfinder.setMovements(movements)
    startLoops()
    log('Spawned')
  })
  bot.on('login', () => log('Logged in'))
  bot.on('death', () => {
    log('Died')
    resetModes()
    setTimeout(() => {
      try {
        if (bot) bot.respawn()
      } catch {}
    }, 1200)
  })
  bot.on('kicked', (reason) => log('Kicked:', reason))
  bot.on('error', (error) => log('Error:', error.message))
  bot.on('chat', (username, message) => {
    handleChat(username, message).catch((error) => log('Command failed:', error.message))
  })
  bot.on('end', (reason) => {
    log('Disconnected:', reason)
    stopLoops()
    resetModes()
    if (CONFIG.reconnectDelay > 0) {
      log('Reconnecting in ' + CONFIG.reconnectDelay + 's')
      reconnectTimer = setTimeout(createBot, CONFIG.reconnectDelay * 1000)
    }
  })
}

createBot()
`;
}
