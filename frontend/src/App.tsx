import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy } from "react";
import Layout from "./components/Layout";
import "./styles/global.css";

// eager only for critical landing
import Dashboard from "./pages/Dashboard";

// lazy for lag-less initial bundle — each page code-splits
const MapPage = lazy(() => import("./pages/MapPage"));
const Social = lazy(() => import("./pages/Social"));
const About = lazy(() => import("./pages/About"));
const MinecraftHosting = lazy(() => import("./pages/MinecraftHosting"));
const VpsHosting = lazy(() => import("./pages/VpsHosting"));
const WebsiteHosting = lazy(() => import("./pages/WebsiteHosting"));
const DatabaseHosting = lazy(() => import("./pages/DatabaseHosting"));
const KsPortal = lazy(() => import("./pages/KsPortal"));
const KsPortalDownloads = lazy(() => import("./pages/KsPortalDownloads"));
const JavaLauncher = lazy(() => import("./pages/JavaLauncher"));
const JavaDownloader = lazy(() => import("./pages/JavaDownloader"));
const JavaDownloaderProject = lazy(() => import("./pages/JavaDownloaderProject"));
const JavaDownloaderDownloads = lazy(() => import("./pages/JavaDownloaderDownloads"));
const BedrockDownloaderProject = lazy(() => import("./pages/BedrockDownloaderProject"));
const BedrockDownloaderDownloads = lazy(() => import("./pages/BedrockDownloaderDownloads"));
const KsClient = lazy(() => import("./pages/KsClient"));
const KsClientDownloads = lazy(() => import("./pages/KsClientDownloads"));
const ServerInfo = lazy(() => import("./pages/ServerInfo"));
const BotPage = lazy(() => import("./pages/BotPage"));
const SetupServer = lazy(() => import("./pages/SetupServer"));
const ServerJarDownloader = lazy(() => import("./pages/ServerJarDownloader"));
const PaidPluginFree = lazy(() => import("./pages/PaidPluginFree"));
const CustomIP = lazy(() => import("./pages/CustomIP"));
const GenericPlaceholder = lazy(() => import("./pages/GenericPlaceholder"));
const NotFound = lazy(() => import("./pages/NotFound"));

// re-export panel pages for lazy wrapper
const PterodactylPage = lazy(() => import("./pages/PterodactylPanel"));
const PufferPage = lazy(() => import("./pages/PufferPanel"));
const AirlinkPage = lazy(() => import("./pages/AirlinkPanel"));
const KsPanelPage = lazy(() => import("./pages/KsPanel"));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="" element={<Dashboard />} />
          <Route path="map" element={<MapPage />} />
          <Route path="social" element={<Social />} />
          <Route path="about" element={<About />} />

          <Route path="minecraft/hosting/free" element={<MinecraftHosting />} />
          <Route path="minecraft/hosting/free.html" element={<MinecraftHosting />} />
          <Route path="vps/hosting/free" element={<VpsHosting />} />
          <Route path="vps/hosting/list/free" element={<VpsHosting />} />
          <Route path="vps/hosting/list/free.html" element={<VpsHosting />} />
          <Route path="website/hosting/free" element={<WebsiteHosting />} />
          <Route path="website/hosting/free.html" element={<WebsiteHosting />} />
          <Route path="website/hosting/list/free" element={<WebsiteHosting />} />
          <Route path="website/hosting/list/free.html" element={<WebsiteHosting />} />
          <Route path="database/hosting/free" element={<DatabaseHosting />} />
          <Route path="database/hosting/free.html" element={<DatabaseHosting />} />
          <Route path="database/hosting/list/free" element={<DatabaseHosting />} />
          <Route path="database/hosting/list/free.html" element={<DatabaseHosting />} />

          <Route path="apps/android/ks-portal" element={<KsPortal />} />
          <Route path="apps/android/ks-portal.html" element={<KsPortal />} />
          <Route path="apps/android/ks-portal/downloads" element={<KsPortalDownloads />} />
          <Route path="apps/android/ks-portal/downloads.html" element={<KsPortalDownloads />} />

          <Route path="minecraft/make-hosting/pterodactyl" element={<PterodactylPage />} />
          <Route path="minecraft/make-hosting/pterodactyl.html" element={<PterodactylPage />} />
          <Route path="minecraft/make-hosting/puffer" element={<PufferPage />} />
          <Route path="minecraft/make-hosting/puffer.html" element={<PufferPage />} />
          <Route path="minecraft/make-hosting/airlink" element={<AirlinkPage />} />
          <Route path="minecraft/make-hosting/airlink.html" element={<AirlinkPage />} />
          <Route path="minecraft/make-hosting/ks-panel" element={<KsPanelPage />} />
          <Route path="minecraft/make-hosting/ks-panel.html" element={<KsPanelPage />} />

          <Route path="minecraft/java/launcher" element={<JavaLauncher />} />
          <Route path="minecraft/java/launcher.html" element={<JavaLauncher />} />
          <Route path="minecraft/java/downloader" element={<JavaDownloader />} />
          <Route path="minecraft/java/downloader.html" element={<JavaDownloader />} />
          <Route path="minecraft/java/downloader/:projectId/downloads" element={<JavaDownloaderDownloads />} />
          <Route path="minecraft/java/downloader/:projectId" element={<JavaDownloaderProject />} />
          <Route path="minecraft/bedrock/downloader/:slug/downloads" element={<BedrockDownloaderDownloads />} />
          <Route path="minecraft/bedrock/downloader/:slug" element={<BedrockDownloaderProject />} />
          <Route path="minecraft/bedrock/ks-client" element={<KsClient />} />
          <Route path="minecraft/bedrock/ks-client.html" element={<KsClient />} />
          <Route path="minecraft/bedrock/ks-client/downloads" element={<KsClientDownloads />} />
          <Route path="minecraft/bedrock/ks-client/downloads.html" element={<KsClientDownloads />} />
          <Route path="minecraft/server/statics" element={<ServerInfo />} />
          <Route path="minecraft/server/statics.html" element={<ServerInfo />} />
          <Route path="minecraft/server/bot" element={<BotPage />} />
          <Route path="minecraft/server/bot.html" element={<BotPage />} />
          <Route path="minecraft/make-server/setup-server-in-vps" element={<SetupServer />} />
          <Route path="minecraft/make-server/setup-server-in-vps.html" element={<SetupServer />} />
          <Route path="minecraft/make-server/server.jar-downloader" element={<ServerJarDownloader />} />
          <Route path="minecraft/make-server/server.jar-downloader.html" element={<ServerJarDownloader />} />
          <Route path="minecraft/make-server/paid-plugin-free" element={<PaidPluginFree />} />
          <Route path="minecraft/make-server/paid-plugin-free.html" element={<PaidPluginFree />} />
          <Route path="minecraft/make-server/custom-ip" element={<CustomIP />} />
          <Route path="minecraft/make-server/custom-ip.html" element={<CustomIP />} />

          {/* Fallback for legacy .html with generic handler */}
          <Route path="minecraft/*" element={<GenericPlaceholder />} />
          <Route path="vps/*" element={<GenericPlaceholder />} />
          <Route path="website/*" element={<GenericPlaceholder />} />
          <Route path="database/*" element={<GenericPlaceholder />} />
          <Route path="apps/*" element={<GenericPlaceholder />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
