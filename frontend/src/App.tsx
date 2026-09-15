import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import MapPage from "./pages/MapPage";
import Social from "./pages/Social";
import About from "./pages/About";
import MinecraftHosting from "./pages/MinecraftHosting";
import VpsHosting from "./pages/VpsHosting";
import { PterodactylPage, PufferPage, SkyportPage } from "./pages/PanelPages";
import JavaLauncher from "./pages/JavaLauncher";
import JavaDownloader from "./pages/JavaDownloader";
import KsClient from "./pages/KsClient";
import ServerInfo from "./pages/ServerInfo";
import BotPage from "./pages/BotPage";
import SetupServer from "./pages/SetupServer";
import ServerJarDownloader from "./pages/ServerJarDownloader";
import PaidPluginFree from "./pages/PaidPluginFree";
import CustomIP from "./pages/CustomIP";
import GenericPlaceholder from "./pages/GenericPlaceholder";
import NotFound from "./pages/NotFound";
import "./styles/global.css";
import "./pages/Panel.css";

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

          <Route path="minecraft/make-hosting/pterodactyl" element={<PterodactylPage />} />
          <Route path="minecraft/make-hosting/pterodactyl.html" element={<PterodactylPage />} />
          <Route path="minecraft/make-hosting/puffer" element={<PufferPage />} />
          <Route path="minecraft/make-hosting/puffer.html" element={<PufferPage />} />
          <Route path="minecraft/make-hosting/skyport" element={<SkyportPage />} />
          <Route path="minecraft/make-hosting/skyport.html" element={<SkyportPage />} />

          <Route path="minecraft/java/launcher" element={<JavaLauncher />} />
          <Route path="minecraft/java/launcher.html" element={<JavaLauncher />} />
          <Route path="minecraft/java/downloader" element={<JavaDownloader />} />
          <Route path="minecraft/java/downloader.html" element={<JavaDownloader />} />
          <Route path="minecraft/bedrock/ks-client" element={<KsClient />} />
          <Route path="minecraft/bedrock/ks-client.html" element={<KsClient />} />
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

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
