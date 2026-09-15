import { Router } from "express";
import type { MinecraftHosting, VpsHosting } from "../types.js";
import mcData from "../data/minecraft-hosting.json" with { type: "json" };
import vpsData from "../data/vps-hosting.json" with { type: "json" };

const router = Router();

const mcHosting = mcData as MinecraftHosting[];
const vpsHosting = vpsData as VpsHosting[];

// Minecraft free hosting with filters: ?q=&uptime=&location=&ram=
router.get("/minecraft", (req, res) => {
  const q = String(req.query.q ?? "").toLowerCase();
  const uptime = String(req.query.uptime ?? "");
  const location = String(req.query.location ?? "").toLowerCase();
  const ram = req.query.ram ? Number(req.query.ram) : 0;

  const filtered = mcHosting.filter((h) => {
    if (q && !String(h.name).toLowerCase().includes(q)) return false;
    if (uptime && h.uptime !== uptime) return false;
    if (location) {
      if (!String(h.location).toLowerCase().includes(location)) return false;
    }
    if (ram) {
      const hRam = Number(h.ram);
      if (isNaN(hRam) || hRam < ram) return false;
    }
    return true;
  });

  res.json({ count: filtered.length, data: filtered });
});

router.get("/minecraft/:id", (req, res) => {
  const idx = Number(req.params.id);
  if (Number.isNaN(idx) || idx < 0 || idx >= mcHosting.length) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(mcHosting[idx]);
});

// VPS free hosting
router.get("/vps", (req, res) => {
  const q = String(req.query.q ?? "").toLowerCase();
  const renew = req.query.renew as string | undefined;
  const sudo = req.query.sudo as string | undefined;
  const alwaysOn = req.query.alwaysOn as string | undefined;

  let result = vpsHosting;
  if (q) result = result.filter((v) => v.name.toLowerCase().includes(q));
  if (renew !== undefined && renew !== "") {
    const b = renew === "true";
    result = result.filter((v) => v.renew === b);
  }
  if (sudo !== undefined && sudo !== "") {
    const b = sudo === "true";
    result = result.filter((v) => v.sudo === b);
  }
  if (alwaysOn !== undefined && alwaysOn !== "") {
    const b = alwaysOn === "true";
    result = result.filter((v) => v.alwaysOn === b);
  }

  res.json({ count: result.length, data: result });
});

export default router;
