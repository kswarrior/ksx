import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import sitemapRouter from "./routes/sitemap.js";
import hostingRouter from "./routes/hosting.js";
import metaRouter from "./routes/meta.js";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());

// API routes
app.use("/api/sitemap", sitemapRouter);
app.use("/api/hosting", hostingRouter);
app.use("/api", metaRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ KSX Backend listening on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});

export default app;
