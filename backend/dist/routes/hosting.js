import { Router } from "express";
import mcData from "../data/minecraft-hosting.json" with { type: "json" };
import vpsData from "../data/vps-hosting.json" with { type: "json" };
import websiteData from "../data/website-hosting.json" with { type: "json" };
import databaseData from "../data/database-hosting.json" with { type: "json" };
const router = Router();
const mcHosting = mcData;
const vpsHosting = vpsData;
const websiteHosting = websiteData;
const databaseHosting = databaseData;
// Minecraft free hosting with filters: ?q=&uptime=&alwaysOn=&location=&ram=
router.get("/minecraft", (req, res) => {
    const q = String(req.query.q ?? "").toLowerCase();
    const uptime = String(req.query.uptime ?? "");
    const alwaysOn = req.query.alwaysOn;
    const location = String(req.query.location ?? "").toLowerCase();
    const ram = req.query.ram ? Number(req.query.ram) : 0;
    const filtered = mcHosting.filter((h) => {
        if (q && !String(h.name).toLowerCase().includes(q))
            return false;
        if (uptime && h.uptime !== uptime)
            return false;
        if (alwaysOn !== undefined && alwaysOn !== "" && h.alwaysOn !== (alwaysOn === "true"))
            return false;
        if (location) {
            if (!String(h.location).toLowerCase().includes(location))
                return false;
        }
        if (ram) {
            const hRam = Number(h.ram);
            if (isNaN(hRam) || hRam < ram)
                return false;
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
    const type = String(req.query.type ?? "").toLowerCase();
    const renew = req.query.renew;
    const sudo = req.query.sudo;
    const alwaysOn = req.query.alwaysOn;
    let result = vpsHosting;
    if (q)
        result = result.filter((v) => v.name.toLowerCase().includes(q));
    if (type)
        result = result.filter((v) => v.type.toLowerCase().includes(type));
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
// Website free hosting
router.get("/website", (req, res) => {
    const q = String(req.query.q ?? "").toLowerCase();
    const type = String(req.query.type ?? "").toLowerCase();
    const customDomain = req.query.customDomain;
    const ssl = req.query.ssl;
    const ads = req.query.ads;
    const alwaysFree = req.query.alwaysFree;
    let result = websiteHosting;
    if (q)
        result = result.filter((h) => h.name.toLowerCase().includes(q));
    if (type)
        result = result.filter((h) => h.type.toLowerCase().includes(type));
    if (customDomain !== undefined && customDomain !== "") {
        result = result.filter((h) => h.customDomain === (customDomain === "true"));
    }
    if (ssl !== undefined && ssl !== "") {
        result = result.filter((h) => h.ssl === (ssl === "true"));
    }
    if (ads !== undefined && ads !== "") {
        result = result.filter((h) => h.ads === (ads === "true"));
    }
    if (alwaysFree !== undefined && alwaysFree !== "") {
        result = result.filter((h) => h.alwaysFree === (alwaysFree === "true"));
    }
    res.json({ count: result.length, data: result });
});
// Database free hosting
router.get("/database", (req, res) => {
    const q = String(req.query.q ?? "").toLowerCase();
    const type = String(req.query.type ?? "").toLowerCase();
    const cardRequired = req.query.cardRequired;
    const backups = req.query.backups;
    const alwaysFree = req.query.alwaysFree;
    const ssl = req.query.ssl;
    let result = databaseHosting;
    if (q)
        result = result.filter((h) => h.name.toLowerCase().includes(q));
    if (type)
        result = result.filter((h) => h.type.toLowerCase().includes(type));
    if (cardRequired !== undefined && cardRequired !== "") {
        result = result.filter((h) => h.cardRequired === (cardRequired === "true"));
    }
    if (backups !== undefined && backups !== "") {
        const hasBackups = backups === "true";
        result = result.filter((h) => (h.backups !== "None") === hasBackups);
    }
    if (alwaysFree !== undefined && alwaysFree !== "") {
        result = result.filter((h) => h.alwaysFree === (alwaysFree === "true"));
    }
    if (ssl !== undefined && ssl !== "") {
        result = result.filter((h) => h.ssl === (ssl === "true"));
    }
    res.json({ count: result.length, data: result });
});
export default router;
