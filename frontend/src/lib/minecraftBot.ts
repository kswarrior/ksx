export type BotAuth = "offline" | "microsoft";

export type BotConfig = {
  host: string;
  port: number;
  username: string;
  owners: string[];
  auth: BotAuth;
  version: string;
  serverPassword: string;
  loginCommand: string;
  loginDelay: number;
  prefix: string;
  reconnectDelay: number;
  autoEat: boolean;
  eatThreshold: number;
  antiAfkJump: boolean;
  jumpInterval: number;
  antiAfkWalk: boolean;
  walkInterval: number;
  autoTotem: boolean;
  autoArmor: boolean;
  autoDefend: boolean;
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
  serverPassword: "",
  loginCommand: "",
  loginDelay: 3,
  prefix: "!",
  reconnectDelay: 5,
  autoEat: true,
  eatThreshold: 15,
  antiAfkJump: true,
  jumpInterval: 45,
  antiAfkWalk: true,
  walkInterval: 60,
  autoTotem: true,
  autoArmor: true,
  autoDefend: true,
  viewDistance: 12,
};

export const BOT_COMMANDS: BotCommand[] = [
  { command: "help", description: "List every available command." },
  { command: "status", description: "Show health, food, position and current mode." },
  { command: "players", description: "List visible players and their distances." },
  { command: "inventory", description: "List every item in the bot inventory." },
  { command: "follow <player>", description: "Follow a player until stopped." },
  { command: "come [player]", description: "Walk to the owner or a named player." },
  { command: "goto <x> <y> <z>", description: "Walk to exact coordinates." },
  { command: "guard", description: "Follow the owner and attack nearby hostile mobs." },
  { command: "stopguard", description: "Stop guard mode." },
  { command: "attack <player>", description: "Chase and attack a player." },
  { command: "huntmobs", description: "Hunt hostile mobs within 32 blocks." },
  { command: "mine <block> [count]", description: "Find and mine nearby blocks by name." },
  { command: "collect", description: "Walk to and pick up nearby dropped items." },
  { command: "equip", description: "Equip the best armor and weapon in inventory." },
  { command: "totem", description: "Move a totem of undying to the off-hand." },
  { command: "drop <item> [count]", description: "Drop an item from the inventory." },
  { command: "say <message>", description: "Send a chat message from the bot." },
  { command: "stop", description: "Cancel the current action and clear movement." },
  { command: "respawn", description: "Respawn the bot after death." },
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
  "creaking",
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
    serverPassword: input.serverPassword.trim(),
    loginCommand: input.loginCommand.trim(),
    loginDelay: clampInt(input.loginDelay, 3, 0, 120),
    prefix: input.prefix.trim() || "!",
    reconnectDelay: clampInt(input.reconnectDelay, 5, 0, 3600),
    autoEat: input.autoEat,
    eatThreshold: clampInt(input.eatThreshold, 15, 1, 20),
    antiAfkJump: input.antiAfkJump,
    jumpInterval: clampInt(input.jumpInterval, 45, 5, 3600),
    antiAfkWalk: input.antiAfkWalk,
    walkInterval: clampInt(input.walkInterval, 60, 5, 3600),
    autoTotem: input.autoTotem,
    autoArmor: input.autoArmor,
    autoDefend: input.autoDefend,
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
    serverPassword: config.serverPassword,
    loginCommand: config.loginCommand,
    loginDelay: config.loginDelay,
    viewDistance: config.viewDistance,
    prefix: config.prefix,
    reconnectDelay: config.reconnectDelay,
    autoEat: config.autoEat,
    eatThreshold: config.eatThreshold,
    antiAfkJump: config.antiAfkJump,
    jumpInterval: config.jumpInterval,
    antiAfkWalk: config.antiAfkWalk,
    walkInterval: config.walkInterval,
    autoTotem: config.autoTotem,
    autoArmor: config.autoArmor,
    autoDefend: config.autoDefend,
  };

  return `const mineflayer = require('mineflayer')

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
let comeTarget = null
let guardMode = false
let huntMode = false
let attackName = null
let autoDefendActive = false
let reconnectTimer = null
let loginTimer = null
let serverLoginDone = false
let eating = false
let lastNoFoodLog = 0
let lastJumpAt = 0
let lastPos = null
let stuckTicks = 0
let strafeUntil = 0
let busy = false
let actionToken = 0

function log(...args) {
  console.log('[' + new Date().toISOString() + ']', ...args)
}

function say(message) {
  try {
    if (bot) bot.chat(String(message).slice(0, 240))
  } catch {}
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function serverLoginCommand() {
  if (CONFIG.loginCommand) {
    return CONFIG.loginCommand.split('{password}').join(CONFIG.serverPassword).split('{username}').join(bot.username || CONFIG.username)
  }
  if (CONFIG.serverPassword) return '/login ' + CONFIG.serverPassword
  return null
}

function sendServerLogin() {
  loginTimer = null
  if (!bot || serverLoginDone) return
  const command = serverLoginCommand()
  if (!command) return
  serverLoginDone = true
  try {
    bot.chat(command)
    log('Sent the configured server login command.')
  } catch (error) {
    serverLoginDone = false
    log('Server login failed:', error.message)
  }
}

function scheduleServerLogin() {
  if (loginTimer) {
    clearTimeout(loginTimer)
    loginTimer = null
  }
  serverLoginDone = false
  if (!CONFIG.serverPassword && !CONFIG.loginCommand) return
  loginTimer = setTimeout(sendServerLogin, Math.max(0, CONFIG.loginDelay) * 1000)
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

function stopMovement() {
  if (!bot) return
  for (const control of CONTROLS) {
    try {
      bot.setControlState(control, false)
    } catch {}
  }
}

function resetModes() {
  actionToken += 1
  busy = false
  followName = null
  comeTarget = null
  guardMode = false
  huntMode = false
  attackName = null
  autoDefendActive = false
  lastPos = null
  stuckTicks = 0
  stopMovement()
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

function nearestItem(maxDistance, excluded) {
  let best = null
  let bestDistance = maxDistance
  for (const entity of Object.values(bot.entities)) {
    if (!entity || entity === bot.entity || !entity.position) continue
    if (entity.name !== 'item' && entity.objectType !== 'Item') continue
    if (excluded && excluded.has(entity.id)) continue
    const distance = entity.position.distanceTo(bot.entity.position)
    if (distance < bestDistance) {
      best = entity
      bestDistance = distance
    }
  }
  return best
}

function currentMode() {
  if (busy) return 'busy'
  if (attackName) return 'attacking ' + attackName
  if (guardMode) return 'guard'
  if (followName) return 'following ' + followName
  if (comeTarget) return 'coming to ' + comeTarget
  if (huntMode) return 'hunting'
  if (autoDefendActive) return 'defending'
  return 'idle'
}

function steerTo(target, range) {
  if (!bot || !bot.entity || !target) return false
  const pos = bot.entity.position
  const distance = pos.distanceTo(target)
  if (distance <= range) {
    stopMovement()
    return true
  }

  try {
    bot.lookAt(target.offset(0, 1, 0), true)
  } catch {}

  try {
    bot.setControlState('forward', true)
    bot.setControlState('sprint', distance > 5)
  } catch {}

  if (lastPos && lastPos.distanceTo(pos) < 0.04) stuckTicks += 1
  else stuckTicks = 0
  lastPos = pos.clone()

  if (stuckTicks > 3 && Date.now() > strafeUntil) {
    strafeUntil = Date.now() + 800
    const control = Math.random() > 0.5 ? 'left' : 'right'
    try {
      bot.setControlState(control, true)
      setTimeout(() => {
        try {
          if (bot) bot.setControlState(control, false)
        } catch {}
      }, 500)
    } catch {}
  }

  if (bot.entity.onGround && Date.now() - lastJumpAt > 800) {
    const needsJump = target.y - pos.y > 0.6 || stuckTicks > 1 || distance > 8
    if (needsJump) {
      lastJumpAt = Date.now()
      try {
        bot.setControlState('jump', true)
        setTimeout(() => {
          try {
            if (bot) bot.setControlState('jump', false)
          } catch {}
        }, 250)
      } catch {}
    }
  }

  return false
}

async function moveTo(target, range, timeout) {
  const token = actionToken
  const started = Date.now()
  let reached = false
  while (bot && bot.entity && token === actionToken && Date.now() - started < timeout) {
    if (bot.entity.position.distanceTo(target) <= range) {
      reached = true
      break
    }
    steerTo(target, range)
    await sleep(100)
  }
  if (token === actionToken) stopMovement()
  return reached
}

function engage(entity) {
  if (!entity || !entity.position) return false
  const distance = bot.entity.position.distanceTo(entity.position)
  if (distance <= 3.4) {
    try {
      bot.setControlState('forward', false)
      bot.setControlState('sprint', false)
    } catch {}
    try {
      const height = entity.height || 1.6
      bot.lookAt(entity.position.offset(0, height * 0.8, 0), true)
      bot.attack(entity)
    } catch {}
  } else {
    steerTo(entity.position, 2.5)
  }
  return true
}

function combatTick() {
  if (!bot || !bot.entity || busy) return

  if (attackName) {
    const target = playerEntity(attackName)
    if (!target) {
      say(attackName + ' is not visible.')
      attackName = null
      stopMovement()
      return
    }
    engage(target)
    return
  }

  if (guardMode) {
    const owner = playerEntity(CONFIG.owners[0])
    const anchor = owner || bot.entity
    const hostile = nearestEntity(anchor.position, HOSTILE_MOBS, 16)
    if (hostile) {
      engage(hostile)
      return
    }
    if (owner) steerTo(owner.position, 3)
    else stopMovement()
    return
  }

  if (followName) {
    const target = playerEntity(followName)
    if (!target) {
      say(followName + ' is not visible.')
      followName = null
      stopMovement()
      return
    }
    steerTo(target.position, 2)
    return
  }

  if (comeTarget) {
    const target = playerEntity(comeTarget)
    if (!target) {
      say(comeTarget + ' is not visible.')
      comeTarget = null
      stopMovement()
      return
    }
    if (steerTo(target.position, 2)) {
      say('Arrived at ' + comeTarget + '.')
      comeTarget = null
    }
    return
  }

  if (huntMode) {
    const hostile = nearestEntity(bot.entity.position, HOSTILE_MOBS, 32)
    if (hostile) {
      engage(hostile)
      return
    }
    huntMode = false
    stopMovement()
    say('No hostile mobs nearby.')
    return
  }

  if (CONFIG.autoDefend) {
    const hostile = nearestEntity(bot.entity.position, HOSTILE_MOBS, 10)
    if (hostile) {
      autoDefendActive = true
      engage(hostile)
      return
    }
  }

  if (autoDefendActive) {
    autoDefendActive = false
    stopMovement()
  }
}

async function autoEat() {
  if (!CONFIG.autoEat || eating || busy || !bot || !bot.entity) return
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
    if (CONFIG.autoArmor) await equipBestGear(true)
  } catch (error) {
    log('Auto-eat failed:', error.message)
  } finally {
    eating = false
  }
}

async function autoTotem() {
  if (!CONFIG.autoTotem || eating || busy || !bot || !bot.entity) return
  if (bot.health > 8) return
  const offhand = bot.inventory.slots[45]
  if (offhand && offhand.name === 'totem_of_undying') return
  const totem = bot.inventory.items().find((item) => item.name === 'totem_of_undying')
  if (!totem) return
  try {
    await bot.equip(totem, 'off-hand')
    log('Auto-equipped a totem of undying.')
  } catch (error) {
    log('Auto-totem failed:', error.message)
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
  }, 500))
  timers.push(setInterval(() => {
    autoEat().catch((error) => log('Auto-eat error:', error.message))
    autoTotem().catch((error) => log('Auto-totem error:', error.message))
  }, 2000))

  if (CONFIG.autoArmor) {
    timers.push(setInterval(() => {
      if (busy || !bot || !bot.entity) return
      equipBestGear(true).catch((error) => log('Auto-armor error:', error.message))
    }, 60000))
  }

  if (CONFIG.antiAfkJump) {
    timers.push(setInterval(() => {
      if (!bot || !bot.entity || busy || followName || guardMode || huntMode || attackName || comeTarget || autoDefendActive) return
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
      if (!bot || !bot.entity || busy || followName || guardMode || huntMode || attackName || comeTarget || autoDefendActive) return
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

function sendChunks(title, entries) {
  let message = title + ':'
  for (const entry of entries) {
    const chunk = message === title + ':' ? ' ' + entry : ' | ' + entry
    if ((message + chunk).length > 240) {
      say(message)
      message = entry
    } else {
      message += chunk
    }
  }
  if (message) say(message)
}

function sendHelp() {
  sendChunks('Commands', HELP.map((entry) => CONFIG.prefix + entry))
}

function sendStatus() {
  if (!bot || !bot.entity) return
  const pos = bot.entity.position
  const health = typeof bot.health === 'number' ? Math.round(bot.health) : 0
  const food = typeof bot.food === 'number' ? Math.round(bot.food) : 0
  say('Health ' + health + '/20 | Food ' + food + '/20 | Position ' + pos.x.toFixed(1) + ', ' + pos.y.toFixed(1) + ', ' + pos.z.toFixed(1) + ' | Mode: ' + currentMode())
}

function listPlayers() {
  if (!bot || !bot.entity) return
  const entries = []
  for (const player of Object.values(bot.players)) {
    if (!player || !player.entity || player.username === bot.username) continue
    const distance = player.entity.position.distanceTo(bot.entity.position)
    entries.push(player.username + ' (' + Math.round(distance) + 'm)')
  }
  if (entries.length === 0) {
    say('No other players nearby.')
    return
  }
  sendChunks('Players', entries)
}

function findInventoryItem(query) {
  const wanted = String(query || '').toLowerCase().replace('minecraft:', '')
  if (!wanted || !bot) return null
  return bot.inventory.items().find((item) => item.name === wanted || item.name.indexOf(wanted) !== -1) || null
}

function listInventory() {
  if (!bot) return
  const entries = bot.inventory.items().map((item) => item.count + 'x ' + item.name)
  if (entries.length === 0) {
    say('Inventory is empty.')
    return
  }
  sendChunks('Inventory', entries)
}

function itemTier(name) {
  const order = ['netherite_', 'diamond_', 'iron_', 'chainmail_', 'golden_', 'leather_']
  const index = order.findIndex((prefix) => name.indexOf(prefix) === 0)
  return index === -1 ? 0 : order.length - index
}

async function equipBestGear(quiet) {
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

  if (!quiet) say(equipped > 0 ? 'Equipped best gear.' : 'No better gear found.')
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

async function dropItem(rawName, rawCount) {
  if (!rawName) {
    say('Usage: ' + CONFIG.prefix + 'drop <item> [count]')
    return
  }
  const item = findInventoryItem(rawName)
  if (!item) {
    say('Item not found in inventory: ' + rawName)
    return
  }
  const count = Math.max(1, Math.min(item.count, parseInt(rawCount, 10) || item.count))
  try {
    await bot.toss(item.type, null, count)
    say('Dropped ' + count + 'x ' + item.name + '.')
  } catch (error) {
    say('Drop failed: ' + error.message)
  }
}

async function mineBlock(rawName, rawCount, token) {
  if (!rawName) {
    say('Usage: ' + CONFIG.prefix + 'mine <block> [count]')
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
  const count = Math.max(1, Math.min(64, parseInt(rawCount, 10) || 1))
  let mined = 0

  while (bot && bot.entity && token === actionToken && mined < count) {
    const target = bot.findBlock({ matching: block.id, maxDistance: 32 })
    if (!target) break
    if (bot.entity.position.distanceTo(target.position) > 3.8) {
      const reached = await moveTo(target.position, 3, 12000)
      if (!reached) break
    }
    try {
      await bot.dig(target)
      mined += 1
    } catch (error) {
      say('Could not mine ' + name + ': ' + error.message)
      break
    }
  }

  if (mined > 0) say('Mined ' + mined + ' ' + name + '.')
  else say('No ' + name + ' within reach.')
}

async function collectItems(token) {
  const seen = new Set()
  let collected = 0
  while (bot && bot.entity && token === actionToken) {
    const item = nearestItem(10, seen)
    if (!item) break
    seen.add(item.id)
    const reached = await moveTo(item.position, 1.2, 6000)
    if (!reached) break
    collected += 1
  }
  if (collected > 0) say('Collected ' + collected + ' item drops.')
  else say('No dropped items nearby.')
}

async function goToCoords(x, y, z, token) {
  if (!bot || !bot.entity) return
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
    say('Usage: ' + CONFIG.prefix + 'goto <x> <y> <z>')
    return
  }
  const pos = bot.entity.position
  const target = pos.offset(x - pos.x, y - pos.y, z - pos.z)
  const reached = await moveTo(target, 1.5, 30000)
  if (token !== actionToken) return
  if (reached) say('Arrived at ' + x + ' ' + y + ' ' + z + '.')
  else say('Could not reach those coordinates.')
}

async function runAction(task) {
  resetModes()
  const token = actionToken
  busy = true
  try {
    await task(token)
  } catch (error) {
    log('Action failed:', error.message)
    say('Action failed: ' + error.message)
  } finally {
    if (token === actionToken) {
      busy = false
      stopMovement()
    }
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
  if (command === 'status') {
    sendStatus()
    return
  }
  if (command === 'players') {
    listPlayers()
    return
  }
  if (command === 'inventory') {
    listInventory()
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
    comeTarget = targetName
    say('Coming to ' + targetName + '.')
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
    stopMovement()
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
    await runAction((token) => mineBlock(arg, parts[1], token))
    return
  }
  if (command === 'collect') {
    await runAction((token) => collectItems(token))
    return
  }
  if (command === 'goto') {
    await runAction((token) => goToCoords(Number(parts[0]), Number(parts[1]), Number(parts[2]), token))
    return
  }
  if (command === 'equip') {
    await equipBestGear(false)
    return
  }
  if (command === 'totem') {
    await equipTotem()
    return
  }
  if (command === 'drop') {
    await dropItem(arg, parts[1])
    return
  }
  if (command === 'say') {
    const text = parts.join(' ').trim()
    if (text) say(text)
    return
  }
  if (command === 'respawn') {
    try {
      bot.respawn()
      say('Respawning.')
    } catch (error) {
      say('Could not respawn: ' + error.message)
    }
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

  bot.once('spawn', () => {
    startLoops()
    log('Spawned')
    scheduleServerLogin()
    if (CONFIG.autoArmor) equipBestGear(true).catch((error) => log('Auto-armor failed:', error.message))
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
    if (loginTimer) {
      clearTimeout(loginTimer)
      loginTimer = null
    }
    serverLoginDone = false
    stopLoops()
    resetModes()
    bot = null
    if (CONFIG.reconnectDelay > 0) {
      log('Reconnecting in ' + CONFIG.reconnectDelay + 's')
      reconnectTimer = setTimeout(createBot, CONFIG.reconnectDelay * 1000)
    }
  })
}

createBot()
`;
}
