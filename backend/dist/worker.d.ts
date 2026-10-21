import { Hono } from "hono";
import type { SocialEnv } from "./types.js";
declare const app: Hono<{
    Bindings: SocialEnv;
}, import("hono/types").BlankSchema, "/">;
export default app;
