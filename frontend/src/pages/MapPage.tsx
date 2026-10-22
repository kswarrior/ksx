import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { SearchField } from "../components/ui";
import { api, SitemapCategory } from "../lib/api";
import Icon from "../components/Icon";
import KsLoader from "../components/KsLoader";
import { RECENT_KEY, MAX_RECENT } from "../hooks/useLocalStorage";
import "./MapPage.css";

type Page = SitemapCategory["sections"][number]["pages"][number];
type Section = SitemapCategory["sections"][number];

type Vec = { x: number; y: number };

type MoonNode = {
  page: Page;
  pos: Vec;
  angle: number;
  key: string;
};

type PlanetNode = {
  section: Section;
  pos: Vec;
  angle: number;
  moons: MoonNode[];
  key: string;
};

type StarNode = {
  category: SitemapCategory;
  pos: Vec;
  angle: number;
  planets: PlanetNode[];
  pageCount: number;
  accent: string;
  rgb: string;
};

type Layout = {
  stars: StarNode[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
};

type Selection =
  | { type: "category"; category: string }
  | { type: "section"; category: string; section: string }
  | null;

type View = { x: number; y: number; z: number };

type Gesture =
  | {
      mode: "pan";
      startX: number;
      startY: number;
      startTf: View;
      rect: DOMRect;
      moved: boolean;
    }
  | {
      mode: "pinch";
      startDist: number;
      startMid: Vec;
      startTf: View;
      rect: DOMRect;
    };

const CORE = { x: 1000, y: 700 };
const CANVAS = { w: 2000, h: 1400 };
const STAR_DIST = 390;
const PLANET_DIST = 225;
const MOON_DIST = 62;
const CORE_R = 66;
const STAR_R = 52;
const PLANET_R = 29;
const MOON_R = 18;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.2;

const PALETTE = [
  { accent: "#6ee7b7", rgb: "110, 231, 183" },
  { accent: "#a5b4fc", rgb: "165, 180, 252" },
  { accent: "#7dd3fc", rgb: "125, 211, 252" },
  { accent: "#f0abfc", rgb: "240, 171, 252" },
  { accent: "#fcd34d", rgb: "252, 211, 77" },
  { accent: "#fca5a5", rgb: "252, 165, 165" },
];

function useDebounced<T>(value: T, ms = 140) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function plural(count: number, singular: string, pluralForm?: string) {
  return `${count} ${count === 1 ? singular : pluralForm ?? `${singular}s`}`;
}

function categoryAngles(count: number): number[] {
  if (count <= 1) return [0];
  if (count === 2) return [Math.PI, 0];
  const start = -Math.PI / 2;
  return Array.from(
    { length: count },
    (_, i) => start + (i * Math.PI * 2) / count
  );
}

function sectionAngles(count: number, outward: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [outward];
  if (count === 2) return [outward - 0.95, outward + 0.95];
  if (count === 3) return [outward - 1.18, outward, outward + 1.18];
  if (count === 4)
    return [outward - 1.55, outward - 0.52, outward + 0.52, outward + 1.55];
  const step = (Math.PI * 2) / count;
  const start = outward + 0.52;
  return Array.from({ length: count }, (_, i) => start + step * i);
}

function moonAngles(count: number, outward: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [outward];
  const spread = Math.min(2.45, 0.9 + count * 0.38);
  const start = outward - spread / 2;
  const step = spread / (count - 1);
  return Array.from({ length: count }, (_, i) => start + step * i);
}

function trimLine(a: Vec, b: Vec, padA: number, padB: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return {
    x1: a.x + (dx / len) * padA,
    y1: a.y + (dy / len) * padA,
    x2: b.x - (dx / len) * padB,
    y2: b.y - (dy / len) * padB,
  };
}

function buildLayout(data: SitemapCategory[]): Layout {
  const angles = categoryAngles(data.length);
  let minX = CORE.x - 150;
  let maxX = CORE.x + 150;
  let minY = CORE.y - 130;
  let maxY = CORE.y + 130;

  const extend = (x: number, y: number, pad: number) => {
    minX = Math.min(minX, x - pad);
    maxX = Math.max(maxX, x + pad);
    minY = Math.min(minY, y - pad);
    maxY = Math.max(maxY, y + pad);
  };

  const stars = data.map<StarNode>((category, ci) => {
    const angle = angles[ci] ?? 0;
    const palette = PALETTE[ci % PALETTE.length];
    const pos = {
      x: CORE.x + Math.cos(angle) * STAR_DIST,
      y: CORE.y + Math.sin(angle) * STAR_DIST,
    };
    extend(pos.x, pos.y, STAR_R + 100);

    const pAngles = sectionAngles(category.sections.length, angle);
    let pageCount = 0;

    const planets = category.sections.map<PlanetNode>((section, si) => {
      const pAngle = pAngles[si] ?? angle;
      const pPos = {
        x: pos.x + Math.cos(pAngle) * PLANET_DIST,
        y: pos.y + Math.sin(pAngle) * PLANET_DIST,
      };
      extend(pPos.x, pPos.y, PLANET_R + 82);

      const mAngles = moonAngles(section.pages.length, pAngle);
      const moons = section.pages.map<MoonNode>((page, mi) => {
        const mAngle = mAngles[mi] ?? pAngle;
        const mPos = {
          x: pPos.x + Math.cos(mAngle) * MOON_DIST,
          y: pPos.y + Math.sin(mAngle) * MOON_DIST,
        };
        extend(mPos.x, mPos.y, MOON_R + 76);
        return {
          page,
          pos: mPos,
          angle: mAngle,
          key: `${category.category}::${section.title}::${page.url}`,
        };
      });

      pageCount += section.pages.length;
      return {
        section,
        pos: pPos,
        angle: pAngle,
        moons,
        key: `${category.category}::${section.title}`,
      };
    });

    return {
      category,
      pos,
      angle,
      planets,
      pageCount,
      accent: palette.accent,
      rgb: palette.rgb,
    };
  });

  return {
    stars,
    bounds: {
      minX: minX - 28,
      maxX: maxX + 28,
      minY: minY - 22,
      maxY: maxY + 22,
    },
  };
}

export default function MapPage() {
  const [data, setData] = useState<SitemapCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const dq = useDebounced(query.trim().toLowerCase(), 140);
  const [selection, setSelection] = useState<Selection>(null);
  const [ready, setReady] = useState(false);
  const [lite, setLite] = useState(false);
  const [paused, setPaused] = useState(false);

  const pageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const tfRef = useRef<View>({ x: 0, y: 0, z: 0.8 });
  const animTimer = useRef<number | undefined>(undefined);
  const interacted = useRef(false);
  const pointers = useRef(new Map<number, Vec>());
  const gesture = useRef<Gesture | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    api
      .getSitemap()
      .then((d) => {
        if (!alive) return;
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Failed to load map");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const layout = useMemo(() => buildLayout(data), [data]);
  const categories = useMemo(() => data.map((c) => c.category), [data]);
  const totalPages = useMemo(
    () =>
      data.reduce(
        (acc, c) => acc + c.sections.reduce((a, s) => a + s.pages.length, 0),
        0
      ),
    [data]
  );
  const totalSections = useMemo(
    () => data.reduce((acc, c) => acc + c.sections.length, 0),
    [data]
  );

  const filtered = useMemo(() => {
    if (!dq) return data;
    return data
      .map((cat) => ({
        ...cat,
        sections: cat.sections
          .map((sec) => ({
            ...sec,
            pages: sec.pages.filter(
              (p) =>
                p.name.toLowerCase().includes(dq) ||
                sec.title.toLowerCase().includes(dq) ||
                cat.category.toLowerCase().includes(dq)
            ),
          }))
          .filter((s) => s.pages.length > 0),
      }))
      .filter((c) => c.sections.length > 0);
  }, [data, dq]);

  const filteredCount = useMemo(
    () =>
      filtered.reduce(
        (acc, c) => acc + c.sections.reduce((a, s) => a + s.pages.length, 0),
        0
      ),
    [filtered]
  );

  const filterSets = useMemo(() => {
    const active = Boolean(dq);
    const cats = new Set<string>();
    const secs = new Set<string>();
    const pages = new Set<string>();
    filtered.forEach((cat) => {
      cats.add(cat.category);
      cat.sections.forEach((sec) => {
        secs.add(`${cat.category}::${sec.title}`);
        sec.pages.forEach((p) => pages.add(p.url));
      });
    });
    return { active, cats, secs, pages };
  }, [filtered, dq]);

  const searchResults = useMemo(
    () =>
      filtered
        .flatMap((category) =>
          category.sections.flatMap((section) =>
            section.pages.map((page) => ({ page, section, category }))
          )
        )
        .slice(0, 8),
    [filtered]
  );

  const selectedCat = useMemo(
    () =>
      selection
        ? data.find((c) => c.category === selection.category) ?? null
        : null,
    [data, selection]
  );

  const selectedSec = useMemo(
    () =>
      selection?.type === "section"
        ? selectedCat?.sections.find((s) => s.title === selection.section) ??
          null
        : null,
    [selectedCat, selection]
  );

  const saveRecent = useCallback(
    (page: Page, category: string, section: string) => {
      try {
        const raw = localStorage.getItem(RECENT_KEY);
        let recent: {
          name: string;
          url: string;
          time: number;
          logo?: string;
          category?: string;
          title?: string;
        }[] = raw ? JSON.parse(raw) : [];
        recent = recent.filter((r) => r.url !== page.url);
        recent.unshift({
          name: page.name,
          url: page.url,
          time: Date.now(),
          logo: page.logo,
          category,
          title: section,
        });
        recent = recent.slice(0, MAX_RECENT);
        localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
      } catch {
        /* ignore */
      }
    },
    []
  );

  const applyTf = useCallback((next: View, animate = false) => {
    const world = worldRef.current;
    if (!world) return;
    tfRef.current = next;
    world.style.transform = `translate3d(${next.x}px, ${next.y}px, 0) scale(${next.z})`;
    world.style.setProperty("--mp-inv", String(1 / next.z));
    const page = pageRef.current;
    if (page) {
      page.dataset.zoom =
        next.z < 0.62 ? "far" : next.z >= 1.02 ? "near" : "mid";
    }
    if (animate) {
      world.classList.add("is-animating");
      window.clearTimeout(animTimer.current);
      animTimer.current = window.setTimeout(
        () => world.classList.remove("is-animating"),
        480
      );
    }
  }, []);

  const clampView = useCallback((view: View, rect: DOMRect): View => {
    const z = clamp(view.z, MIN_ZOOM, MAX_ZOOM);
    const w = CANVAS.w * z;
    const h = CANVAS.h * z;
    const margin = 80;
    let x = view.x;
    let y = view.y;
    if (w <= rect.width) x = (rect.width - w) / 2;
    else x = clamp(x, rect.width - w - margin, margin);
    if (h <= rect.height) y = (rect.height - h) / 2;
    else y = clamp(y, rect.height - h - margin, margin);
    return { x, y, z };
  }, []);

  const fitView = useCallback(
    (animate = false) => {
      const vp = viewportRef.current;
      if (!vp) return;
      const rect = vp.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const b = layout.bounds;
      const padX = Math.min(76, rect.width * 0.075);
      const padY = Math.min(76, rect.height * 0.075);
      const bw = Math.max(1, b.maxX - b.minX);
      const bh = Math.max(1, b.maxY - b.minY);
      const z = clamp(
        Math.min(
          (rect.width - padX * 2) / bw,
          (rect.height - padY * 2) / bh,
          1.1
        ),
        MIN_ZOOM,
        MAX_ZOOM
      );
      const cx = (b.minX + b.maxX) / 2;
      const cy = (b.minY + b.maxY) / 2;
      applyTf(
        clampView(
          {
            x: rect.width / 2 - cx * z,
            y: rect.height / 2 - cy * z,
            z,
          },
          rect
        ),
        animate
      );
    },
    [applyTf, clampView, layout.bounds]
  );

  useEffect(() => {
    if (loading || error || layout.stars.length === 0) return;
    const id = requestAnimationFrame(() => {
      fitView(false);
      setReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, [error, fitView, layout.stars.length, loading]);

  useEffect(() => {
    if (!ready) return;
    const vp = viewportRef.current;
    if (!vp) return;
    let raf = 0;
    const ro = new ResizeObserver(() => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rect = vp.getBoundingClientRect();
        if (!interacted.current) fitView(false);
        else applyTf(clampView(tfRef.current, rect), false);
      });
    });
    ro.observe(vp);
    return () => {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [applyTf, clampView, fitView, ready]);

  useEffect(() => {
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    const detect = () => {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      const cores = nav.hardwareConcurrency ?? 8;
      const mem = nav.deviceMemory ?? 8;
      setLite(
        reduced ||
          cores <= 4 ||
          mem <= 4 ||
          nav.connection?.saveData === true
      );
    };
    detect();
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    mql.addEventListener("change", detect);
    return () => mql.removeEventListener("change", detect);
  }, []);

  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selection) {
        setSelection(null);
        return;
      }
      if (query) setQuery("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [query, selection]);

  const focusNode = useCallback(
    (pos: Vec, zoom: number) => {
      const vp = viewportRef.current;
      if (!vp) return;
      const rect = vp.getBoundingClientRect();
      const z = clamp(
        Math.max(tfRef.current.z, zoom),
        MIN_ZOOM,
        MAX_ZOOM
      );
      const narrow = rect.width < 720;
      const cx = rect.width / 2;
      const cy = rect.height * (narrow ? 0.4 : 0.5);
      interacted.current = true;
      applyTf(
        clampView(
          { x: cx - pos.x * z, y: cy - pos.y * z, z },
          rect
        ),
        true
      );
    },
    [applyTf, clampView]
  );

  const selectCategory = useCallback(
    (category: string) => {
      const star = layout.stars.find(
        (s) => s.category.category === category
      );
      setSelection((prev) =>
        prev?.type === "category" && prev.category === category
          ? null
          : { type: "category", category }
      );
      if (star) focusNode(star.pos, 0.92);
    },
    [focusNode, layout.stars]
  );

  const showCategory = useCallback(
    (category: string) => {
      setSelection({ type: "category", category });
      const star = layout.stars.find(
        (s) => s.category.category === category
      );
      if (star) focusNode(star.pos, 0.92);
    },
    [focusNode, layout.stars]
  );

  const showSection = useCallback(
    (category: string, section: string) => {
      setSelection({ type: "section", category, section });
      const planet = layout.stars
        .find((s) => s.category.category === category)
        ?.planets.find((p) => p.section.title === section);
      if (planet) focusNode(planet.pos, 1.18);
    },
    [focusNode, layout.stars]
  );

  const resetMap = useCallback(() => {
    setSelection(null);
    setActiveCat("All");
    setQuery("");
    interacted.current = false;
    fitView(true);
  }, [fitView]);

  const clearFilters = useCallback(() => {
    setQuery("");
    setActiveCat("All");
    setSelection(null);
  }, []);

  const zoomBy = useCallback(
    (factor: number) => {
      const vp = viewportRef.current;
      if (!vp) return;
      const rect = vp.getBoundingClientRect();
      const cur = tfRef.current;
      const z = clamp(cur.z * factor, MIN_ZOOM, MAX_ZOOM);
      if (z === cur.z) return;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      interacted.current = true;
      applyTf(
        clampView(
          {
            x: cx - (cx - cur.x) * (z / cur.z),
            y: cy - (cy - cur.y) * (z / cur.z),
            z,
          },
          rect
        ),
        true
      );
    },
    [applyTf, clampView]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const target = e.target as Element;
      if (target.closest(".mp-node")) return;
      const vp = viewportRef.current;
      if (!vp) return;
      const rect = vp.getBoundingClientRect();
      vp.setPointerCapture(e.pointerId);
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      interacted.current = true;
      viewportRef.current?.classList.add("is-dragging");

      if (pointers.current.size === 1) {
        gesture.current = {
          mode: "pan",
          startX: e.clientX,
          startY: e.clientY,
          startTf: { ...tfRef.current },
          rect,
          moved: false,
        };
      } else if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()];
        gesture.current = {
          mode: "pinch",
          startDist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
          startMid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
          startTf: { ...tfRef.current },
          rect,
        };
      }
    },
    []
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const g = gesture.current;
      if (!g) return;

      if (g.mode === "pan") {
        if (pointers.current.size !== 1) return;
        const dx = e.clientX - g.startX;
        const dy = e.clientY - g.startY;
        if (Math.abs(dx) + Math.abs(dy) > 3) g.moved = true;
        if (!g.moved) return;
        applyTf(
          clampView(
            { x: g.startTf.x + dx, y: g.startTf.y + dy, z: g.startTf.z },
            g.rect
          ),
          false
        );
        return;
      }

      const pts = [...pointers.current.values()].slice(0, 2);
      if (pts.length < 2) return;
      const dist = Math.max(
        1,
        Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      );
      const mid = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2,
      };
      const z = clamp(
        g.startTf.z * (dist / g.startDist),
        MIN_ZOOM,
        MAX_ZOOM
      );
      const worldX =
        (g.startMid.x - g.rect.left - g.startTf.x) / g.startTf.z;
      const worldY =
        (g.startMid.y - g.rect.top - g.startTf.y) / g.startTf.z;
      applyTf(
        clampView(
          {
            x: mid.x - g.rect.left - worldX * z,
            y: mid.y - g.rect.top - worldY * z,
            z,
          },
          g.rect
        ),
        false
      );
    },
    [applyTf, clampView]
  );

  const endPointer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      pointers.current.delete(e.pointerId);
      if (pointers.current.size === 0) {
        gesture.current = null;
        viewportRef.current?.classList.remove("is-dragging");
      } else if (pointers.current.size === 1) {
        const [p] = [...pointers.current.values()];
        const vp = viewportRef.current;
        gesture.current = vp
          ? {
              mode: "pan",
              startX: p.x,
              startY: p.y,
              startTf: { ...tfRef.current },
              rect: vp.getBoundingClientRect(),
              moved: true,
            }
          : null;
      }
    },
    []
  );

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    let frame = 0;
    let latest: WheelEvent | null = null;

    const applyWheel = (ev: WheelEvent) => {
      const rect = vp.getBoundingClientRect();
      const cx = ev.clientX - rect.left;
      const cy = ev.clientY - rect.top;
      const cur = tfRef.current;
      const unit =
        ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? rect.height : 1;
      const factor = Math.exp(-ev.deltaY * unit * 0.0015);
      const z = clamp(cur.z * factor, MIN_ZOOM, MAX_ZOOM);
      if (z === cur.z) return;
      interacted.current = true;
      applyTf(
        clampView(
          {
            x: cx - (cx - cur.x) * (z / cur.z),
            y: cy - (cy - cur.y) * (z / cur.z),
            z,
          },
          rect
        ),
        false
      );
    };

    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      latest = ev;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const pending = latest;
        latest = null;
        if (pending) applyWheel(pending);
      });
    };

    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      vp.removeEventListener("wheel", onWheel);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [applyTf, clampView]);

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchResults.length > 0) {
      e.preventDefault();
      const first = searchResults[0];
      saveRecent(first.page, first.category.category, first.section.title);
      navigate(first.page.url);
    } else if (e.key === "Escape") {
      setQuery("");
    }
  };

  if (loading) {
    return (
      <div className="map-page mp-lite">
        <div className="mp-sky" aria-hidden>
          <div className="mp-stars s1" />
          <div className="mp-stars s2" />
          <div className="mp-nebula n1" />
          <div className="mp-nebula n2" />
        </div>
        <div className="mp-loading">
          <KsLoader label="Mapping the universe" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-page mp-lite">
        <div className="mp-sky" aria-hidden>
          <div className="mp-stars s1" />
          <div className="mp-stars s2" />
        </div>
        <div className="mp-error-card">
          <div className="mp-error-icon">
            <Icon name="warning" size={24} />
          </div>
          <h2>Couldn’t load the map</h2>
          <p>{error}</p>
          <button className="mp-btn" onClick={() => location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filterActive = filterSets.active;
  const selCatName = selection?.category ?? null;
  const selSecName = selection?.type === "section" ? selection.section : null;

  return (
    <div
      ref={pageRef}
      className={[
        "map-page",
        lite ? "mp-lite" : "",
        paused ? "is-paused" : "",
        selection ? "has-selection" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mp-sky" aria-hidden>
        <div className="mp-stars s1" />
        <div className="mp-stars s2" />
        <div className="mp-stars s3" />
        <div className="mp-nebula n1" />
        <div className="mp-nebula n2" />
        <div className="mp-vignette" />
      </div>

      <div
        ref={viewportRef}
        className="mp-viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onLostPointerCapture={endPointer}
      >
        <div
          ref={worldRef}
          className={`mp-world${ready ? " is-ready" : ""}`}
          style={{ ["--mp-inv" as string]: "1" } as React.CSSProperties}
        >
          <div className="mp-grid" aria-hidden />

          <svg
            className="mp-links"
            width={CANVAS.w}
            height={CANVAS.h}
            viewBox={`0 0 ${CANVAS.w} ${CANVAS.h}`}
            aria-hidden
          >
            {layout.stars.length > 1 && (
              <circle
                className="mp-orbit-line mp-orbit-core"
                cx={CORE.x}
                cy={CORE.y}
                r={STAR_DIST}
              />
            )}

            {layout.stars.map((star) => {
              const coreLine = trimLine(CORE, star.pos, CORE_R, STAR_R);
              return (
                <g key={star.category.category}>
                  <circle
                    className="mp-orbit-line"
                    cx={star.pos.x}
                    cy={star.pos.y}
                    r={PLANET_DIST}
                    style={{ stroke: `rgba(${star.rgb}, 0.16)` }}
                  />
                  <line
                    className="mp-link mp-link--core"
                    x1={coreLine.x1}
                    y1={coreLine.y1}
                    x2={coreLine.x2}
                    y2={coreLine.y2}
                  />

                  {star.planets.map((planet) => {
                    const starLine = trimLine(
                      star.pos,
                      planet.pos,
                      STAR_R,
                      PLANET_R
                    );
                    return (
                      <g key={planet.key}>
                        <circle
                          className="mp-orbit-line mp-orbit-line--moon"
                          cx={planet.pos.x}
                          cy={planet.pos.y}
                          r={MOON_DIST}
                          style={{ stroke: `rgba(${star.rgb}, 0.18)` }}
                        />
                        <line
                          className="mp-link mp-link--star"
                          x1={starLine.x1}
                          y1={starLine.y1}
                          x2={starLine.x2}
                          y2={starLine.y2}
                          style={{ stroke: `rgba(${star.rgb}, 0.52)` }}
                        />
                        {planet.moons.map((moon) => {
                          const moonLine = trimLine(
                            planet.pos,
                            moon.pos,
                            PLANET_R,
                            MOON_R
                          );
                          return (
                            <line
                              key={moon.key}
                              className="mp-link mp-link--moon"
                              x1={moonLine.x1}
                              y1={moonLine.y1}
                              x2={moonLine.x2}
                              y2={moonLine.y2}
                            />
                          );
                        })}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>

          <div
            className="mp-node mp-core-node"
            style={{ left: CORE.x, top: CORE.y }}
          >
            <button
              className="mp-core"
              type="button"
              onClick={resetMap}
              aria-label="KS core — reset the map view"
              title="KS core — reset view"
            >
              <span className="mp-core-inner">
                <span className="mp-core-text">KS</span>
                <span className="mp-core-caption">CORE</span>
              </span>
            </button>
            <span className="mp-core-label">
              <strong>KS Universe</strong>
              <em>tap to reset view</em>
            </span>
          </div>

          {layout.stars.map((star) => {
            const catSelected = selCatName === star.category.category;
            const catFocused =
              selection?.type === "category" && catSelected;
            const catMuted = Boolean(selection) && !catSelected;
            const catDimmed =
              filterActive && !filterSets.cats.has(star.category.category);

            return (
              <Fragment key={star.category.category}>
                <div
                  className="mp-node mp-star-node"
                  style={
                    {
                      left: star.pos.x,
                      top: star.pos.y,
                      "--accent": star.accent,
                      "--rgb": star.rgb,
                    } as React.CSSProperties
                  }
                >
                  <button
                    type="button"
                    className={[
                      "mp-star",
                      catSelected ? "is-active" : "",
                      catFocused ? "is-focused" : "",
                      catMuted ? "is-muted" : "",
                      catDimmed ? "is-dimmed" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() =>
                      selectCategory(star.category.category)
                    }
                    aria-label={`${star.category.category} star — ${plural(star.planets.length, "planet")}, ${plural(star.pageCount, "moon")}`}
                  >
                    <span
                      className="mp-star-icon"
                      dangerouslySetInnerHTML={{
                        __html: star.category.icon,
                      }}
                    />
                  </button>
                  <span className="mp-node-label mp-star-label">
                    <strong className="mp-star-name">
                      {star.category.category}
                    </strong>
                    <em className="mp-star-meta">
                      {plural(star.planets.length, "planet")} ·{" "}
                      {plural(star.pageCount, "moon")}
                    </em>
                  </span>
                </div>

                {star.planets.map((planet) => {
                  const secFocused =
                    selSecName === planet.section.title && catSelected;
                  const secMuted =
                    Boolean(selection) &&
                    (!catSelected ||
                      (selection?.type === "section" &&
                        selection.section !== planet.section.title));
                  const secDimmed =
                    filterActive && !filterSets.secs.has(planet.key);

                  return (
                    <Fragment key={planet.key}>
                      <div
                        className="mp-node mp-planet-node"
                        style={
                          {
                            left: planet.pos.x,
                            top: planet.pos.y,
                            "--accent": star.accent,
                            "--rgb": star.rgb,
                          } as React.CSSProperties
                        }
                      >
                        <button
                          type="button"
                          className={[
                            "mp-planet",
                            secFocused ? "is-focused" : "",
                            secMuted ? "is-muted" : "",
                            secDimmed ? "is-dimmed" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={() =>
                            showSection(
                              star.category.category,
                              planet.section.title
                            )
                          }
                          aria-label={`${planet.section.title} planet — ${plural(planet.moons.length, "moon")} in ${star.category.category}`}
                        >
                          <span
                            className="mp-planet-icon"
                            dangerouslySetInnerHTML={{
                              __html: planet.section.icon,
                            }}
                          />
                        </button>
                        <span className="mp-node-label mp-planet-label">
                          <strong className="mp-planet-name">
                            {planet.section.title}
                          </strong>
                          <em className="mp-planet-meta">
                            {plural(planet.moons.length, "moon")}
                          </em>
                        </span>
                      </div>

                      {planet.moons.map((moon) => {
                        const moonMuted =
                          Boolean(selection) &&
                          (!catSelected ||
                            (selection?.type === "section" &&
                              selection.section !==
                                planet.section.title));
                        const moonDimmed =
                          filterActive &&
                          !filterSets.pages.has(moon.page.url);
                        const mx = Math.cos(moon.angle) * 40;
                        const my = Math.sin(moon.angle) * 40;

                        return (
                          <div
                            key={moon.key}
                            className="mp-node mp-moon-node"
                            style={
                              {
                                left: moon.pos.x,
                                top: moon.pos.y,
                                "--accent": star.accent,
                                "--rgb": star.rgb,
                                "--mx": `${mx}px`,
                                "--my": `${my}px`,
                              } as React.CSSProperties
                            }
                          >
                            <Link
                              to={moon.page.url}
                              className={[
                                "mp-moon",
                                secFocused ? "is-focused" : "",
                                moonMuted ? "is-muted" : "",
                                moonDimmed ? "is-dimmed" : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              aria-label={`Open ${moon.page.name}`}
                              onClick={() =>
                                saveRecent(
                                  moon.page,
                                  star.category.category,
                                  planet.section.title
                                )
                              }
                            >
                              <span
                                className="mp-moon-logo"
                                dangerouslySetInnerHTML={{
                                  __html: moon.page.logo,
                                }}
                              />
                            </Link>
                            <span className="mp-moon-label">
                              {moon.page.name}
                            </span>
                          </div>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </Fragment>
            );
          })}
        </div>
      </div>

      <div className="mp-hud mp-search-hud" role="search">
        <div className="mp-hud-head">
          <div className="mp-brand">
            <span className="mp-brand-mark" aria-hidden>
              KS
            </span>
            <span className="mp-brand-name">
              <strong>KS Universe</strong>
              <em>Sites map</em>
            </span>
          </div>
          <button
            type="button"
            className="mp-hud-btn"
            onClick={() => setDirectoryOpen(true)}
            aria-label="Open sitemap directory"
            title="Sitemap directory"
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M8 6h13M8 12h13M8 18h13" />
              <circle cx="4" cy="6" r="1.2" />
              <circle cx="4" cy="12" r="1.2" />
              <circle cx="4" cy="18" r="1.2" />
            </svg>
            <span>Directory</span>
          </button>
        </div>

        <SearchField
          ref={searchRef}
          className="mp-search"
          value={query}
          onValueChange={setQuery}
          onKeyDown={onSearchKeyDown}
          placeholder="Search stars, planets, moons…"
          ariaLabel="Search the KS map"
        />

        <div className="mp-search-meta">
          <span>
            {filterActive ? (
              <>
                <strong>{filteredCount}</strong> of{" "}
                <strong>{totalPages}</strong> pages
              </>
            ) : (
              <>
                <strong>{totalPages}</strong> pages ·{" "}
                <strong>{totalSections}</strong>{" "}
                {totalSections === 1 ? "planet" : "planets"}
              </>
            )}
          </span>
          {filterActive && (
            <button type="button" className="mp-clear" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>

        <div className="mp-chips" role="tablist" aria-label="Map categories">
          <button
            type="button"
            className={`mp-chip${activeCat === "All" ? " active" : ""}`}
            role="tab"
            aria-selected={activeCat === "All"}
            onClick={() => {
              setActiveCat("All");
              setSelection(null);
            }}
          >
            All <em>{totalPages}</em>
          </button>
          {data.map((cat, index) => {
            const count = cat.sections.reduce(
              (a, s) => a + s.pages.length,
              0
            );
            const palette = PALETTE[index % PALETTE.length];
            return (
              <button
                key={cat.category}
                type="button"
                className={`mp-chip${
                  activeCat === cat.category ? " active" : ""
                }`}
                role="tab"
                aria-selected={activeCat === cat.category}
                onClick={() => {
                  setActiveCat(cat.category);
                  setSelection(null);
                }}
                style={
                  {
                    "--accent": palette.accent,
                    "--rgb": palette.rgb,
                  } as React.CSSProperties
                }
              >
                <span
                  className="mp-chip-icon"
                  dangerouslySetInnerHTML={{ __html: cat.icon }}
                />
                {cat.category} <em>{count}</em>
              </button>
            );
          })}
        </div>

        {query.trim() && (
          <div className="mp-results">
            <div className="mp-results-head">
              {filteredCount} match{filteredCount === 1 ? "" : "es"}
            </div>
            {searchResults.length > 0 ? (
              searchResults.map((result) => (
                <Link
                  key={`${result.category.category}-${result.section.title}-${result.page.url}`}
                  to={result.page.url}
                  className="mp-result"
                  onClick={() =>
                    saveRecent(
                      result.page,
                      result.category.category,
                      result.section.title
                    )
                  }
                >
                  <span
                    className="mp-result-logo"
                    dangerouslySetInnerHTML={{
                      __html: result.page.logo,
                    }}
                  />
                  <span className="mp-result-text">
                    <strong>{result.page.name}</strong>
                    <em>
                      {result.section.title} · {result.category.category}
                    </em>
                  </span>
                  <Icon name="arrow-up-right" size={12} />
                </Link>
              ))
            ) : (
              <div className="mp-results-empty">
                No pages match “{query.trim()}”.
              </div>
            )}
          </div>
        )}
      </div>

      {selection && (selectedCat || selectedSec) && (
        <aside className="mp-details" aria-live="polite">
          <button
            type="button"
            className="mp-details-close"
            onClick={() => setSelection(null)}
            aria-label="Close details"
          >
            <Icon name="close" size={14} />
          </button>

          {selectedSec && selectedCat ? (
            <>
              <span className="mp-eyebrow">Moon system</span>
              <h2>{selectedSec.title}</h2>
              <p className="mp-details-sub">
                {selectedCat.category} ·{" "}
                {plural(selectedSec.pages.length, "moon")} linked
              </p>
              <div className="mp-details-list">
                {selectedSec.pages.map((page) => (
                  <Link
                    key={page.url}
                    to={page.url}
                    className="mp-detail-link"
                    onClick={() =>
                      saveRecent(page, selectedCat.category, selectedSec.title)
                    }
                  >
                    <span
                      className="mp-detail-logo"
                      dangerouslySetInnerHTML={{ __html: page.logo }}
                    />
                    <span className="mp-detail-text">
                      <strong>{page.name}</strong>
                      <em>Open moon</em>
                    </span>
                    <Icon name="arrow-up-right" size={13} />
                  </Link>
                ))}
              </div>
              <button
                type="button"
                className="mp-details-back"
                onClick={() => showCategory(selectedCat.category)}
              >
                <Icon name="chevron-left" size={13} />
                Back to {selectedCat.category}
              </button>
            </>
          ) : selectedCat ? (
            <>
              <span className="mp-eyebrow">Category star</span>
              <h2>{selectedCat.category}</h2>
              <p className="mp-details-sub">
                {plural(selectedCat.sections.length, "planet")} ·{" "}
                {plural(
                  selectedCat.sections.reduce(
                    (a, s) => a + s.pages.length,
                    0
                  ),
                  "moon"
                )}
              </p>
              <div className="mp-details-list">
                {selectedCat.sections.map((section) => (
                  <button
                    key={section.title}
                    type="button"
                    className="mp-detail-link"
                    onClick={() =>
                      showSection(selectedCat.category, section.title)
                    }
                  >
                    <span
                      className="mp-detail-logo"
                      dangerouslySetInnerHTML={{ __html: section.icon }}
                    />
                    <span className="mp-detail-text">
                      <strong>{section.title}</strong>
                      <em>{plural(section.pages.length, "moon")}</em>
                    </span>
                    <Icon name="chevron-right" size={13} />
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </aside>
      )}

      <div className="mp-zoom" role="group" aria-label="Map zoom controls">
        <button
          type="button"
          onClick={() => zoomBy(1.28)}
          aria-label="Zoom in"
          title="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1 / 1.28)}
          aria-label="Zoom out"
          title="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          className="mp-zoom-fit"
          onClick={() => {
            interacted.current = false;
            fitView(true);
          }}
          aria-label="Fit map to screen"
          title="Fit map"
        >
          <svg viewBox="0 0 24 24" aria-hidden>
            <circle cx="12" cy="12" r="3.2" />
            <path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4" />
          </svg>
        </button>
      </div>

      <div className="mp-legend" role="note" aria-label="Map legend">
        <span className="mp-legend-title">Map legend</span>
        <div className="mp-legend-row">
          <span className="mp-legend-dot core" aria-hidden />
          <span>
            <strong>KS core</strong>
            <em>Start here</em>
          </span>
        </div>
        <div className="mp-legend-row">
          <span className="mp-legend-dot star" aria-hidden />
          <span>
            <strong>Star</strong>
            <em>Category · {categories.length}</em>
          </span>
        </div>
        <div className="mp-legend-row">
          <span className="mp-legend-dot planet" aria-hidden />
          <span>
            <strong>Planet</strong>
            <em>Section · {totalSections}</em>
          </span>
        </div>
        <div className="mp-legend-row">
          <span className="mp-legend-dot moon" aria-hidden />
          <span>
            <strong>Moon</strong>
            <em>Page · {totalPages}</em>
          </span>
        </div>
        <span className="mp-legend-hint">
          Drag to explore · scroll to zoom
        </span>
      </div>

      {directoryOpen && (
        <div
          className="mp-dir-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Sitemap directory"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDirectoryOpen(false);
          }}
        >
          <div className="mp-dir">
            <header className="mp-dir-head">
              <div>
                <span className="mp-eyebrow">Complete index</span>
                <h2>Sitemap directory</h2>
                <p>
                  {plural(filteredCount, "page")} in{" "}
                  {plural(filtered.length, "category", "categories")}
                </p>
              </div>
              <button
                type="button"
                className="mp-dir-close"
                onClick={() => setDirectoryOpen(false)}
                aria-label="Close directory"
              >
                <Icon name="close" size={16} />
              </button>
            </header>

            <div className="mp-dir-body">
              {filtered.length === 0 ? (
                <div className="mp-dir-empty">
                  No pages match “{query.trim()}”.
                </div>
              ) : (
                filtered.map((cat) => {
                  const count = cat.sections.reduce(
                    (a, s) => a + s.pages.length,
                    0
                  );
                  return (
                    <section key={cat.category} className="mp-dir-cat">
                      <div className="mp-dir-cat-head">
                        <span
                          className="mp-dir-icon"
                          dangerouslySetInnerHTML={{ __html: cat.icon }}
                        />
                        {cat.category}
                        <em>{plural(count, "page")}</em>
                      </div>

                      {cat.sections.map((sec) => (
                        <div
                          key={`${cat.category}-${sec.title}`}
                          className="mp-dir-sec"
                        >
                          <div className="mp-dir-sec-head">
                            <span
                              className="mp-dir-icon"
                              dangerouslySetInnerHTML={{
                                __html: sec.icon,
                              }}
                            />
                            {sec.title}
                            <em>{sec.pages.length}</em>
                          </div>
                          <div className="mp-dir-pages">
                            {sec.pages.map((page) => (
                              <Link
                                key={page.url}
                                to={page.url}
                                className="mp-dir-page"
                                onClick={() =>
                                  saveRecent(
                                    page,
                                    cat.category,
                                    sec.title
                                  )
                                }
                              >
                                <span
                                  className="mp-dir-page-logo"
                                  dangerouslySetInnerHTML={{
                                    __html: page.logo,
                                  }}
                                />
                                <span>{page.name}</span>
                                <Icon
                                  name="arrow-up-right"
                                  size={11}
                                />
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </section>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
