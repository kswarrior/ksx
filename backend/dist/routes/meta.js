import { Router } from "express";
const router = Router();
router.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});
router.get("/stats", (_req, res) => {
    res.json({
        name: "KSX API",
        version: "1.0.0",
        description: "KS Warrior Backend",
        endpoints: [
            "GET /api/health",
            "GET /api/sitemap",
            "GET /api/sitemap/search?q=",
            "GET /api/hosting/minecraft?q=&uptime=&location=&ram=",
            "GET /api/hosting/vps?q=&renew=&sudo=&alwaysOn=",
        ],
    });
});
export default router;
