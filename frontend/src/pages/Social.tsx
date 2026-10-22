import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { api, type SocialStat, type SocialStats } from "../lib/api";
import "./Social.css";

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M7 17 17 7" />
    <path d="M8 7h9v9" />
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 11a8 8 0 1 0-2.34 5.66" />
    <path d="M20 4v7h-7" />
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path
      fill="#FF0000"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
    />
  </svg>
);

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path
      fill="#fff"
      d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056c2.053 1.508 4.041 2.423 5.993 3.03a.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.128 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.029c1.961-.607 3.95-1.522 6.002-3.03a.077.077 0 0 0 .031-.055c.5-5.177-.838-9.674-3.548-13.66a.061.061 0 0 0-.031-.029zM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.095 2.157 2.419 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.175 1.095 2.157 2.419 0 1.333-.946 2.419-2.157 2.419z"
    />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path
      fill="#fff"
      d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"
    />
  </svg>
);

type LoadState = {
  stats: SocialStats | null;
  loading: boolean;
  refreshing: boolean;
  failed: boolean;
};

function useLiveSocialStats() {
  const [state, setState] = useState<LoadState>({
    stats: null,
    loading: true,
    refreshing: false,
    failed: false,
  });
  const cancelledRef = useRef(false);
  const inFlightRef = useRef(false);

  const load = useCallback(async (force: boolean, manual: boolean) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setState((current) => ({
      ...current,
      loading: current.stats === null,
      refreshing: manual && current.stats !== null,
    }));

    try {
      const stats = await api.getSocialStats(force);
      if (!cancelledRef.current) {
        setState({ stats, loading: false, refreshing: false, failed: false });
      }
    } catch {
      if (!cancelledRef.current) {
        setState((current) => ({
          ...current,
          loading: false,
          refreshing: false,
          failed: true,
        }));
      }
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    void load(false, false);
    const timer = window.setInterval(() => {
      void load(false, false);
    }, 60_000);

    return () => {
      cancelledRef.current = true;
      window.clearInterval(timer);
    };
  }, [load]);

  const refresh = useCallback(() => {
    void load(true, true);
  }, [load]);

  return { ...state, refresh };
}

function formatOnline(count: number): string {
  return new Intl.NumberFormat("en-US").format(count);
}

type SocialCardProps = {
  className: string;
  url: string;
  icon: ReactNode;
  title: string;
  handle: string;
  metric: string;
  note: string;
  stat?: SocialStat;
  loading: boolean;
};

function SocialCard({
  className,
  url,
  icon,
  title,
  handle,
  metric,
  note,
  stat,
  loading,
}: SocialCardProps) {
  const available = Boolean(stat?.available && stat.display);
  const showSkeleton = loading && !stat;
  const statusLabel = available ? "Live" : showSkeleton ? "Syncing" : "No data";
  const statusClass = available ? "live" : showSkeleton ? "syncing" : "nodata";
  const noteText = available
    ? stat?.platform === "discord" && typeof stat.online === "number"
      ? `${formatOnline(stat.online)} online now`
      : note
    : showSkeleton
      ? "Reading live data…"
      : note;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`so-card ${className}`}
      title={stat?.error}
    >
      <div className="so-logo" aria-hidden>
        {icon}
      </div>
      <div className="so-content" aria-live="polite" aria-busy={loading}>
        <div className="so-head">
          <h3>{title}</h3>
          <span className={`so-status ${statusClass}`}>
            <span className="so-status-dot" aria-hidden />
            {statusLabel}
          </span>
        </div>
        <span className="so-handle">{handle}</span>
        <div className="so-stat">
          {showSkeleton ? (
            <span className="so-stat-skeleton" aria-hidden />
          ) : (
            <strong className={available ? "" : "is-muted"}>
              {available ? stat?.display : "—"}
            </strong>
          )}
          <span>{metric}</span>
        </div>
        <span className="so-note">{noteText}</span>
      </div>
      <span className="so-arrow">
        <ArrowIcon />
      </span>
    </a>
  );
}

export default function Social() {
  const { stats, loading, refreshing, failed, refresh } = useLiveSocialStats();
  const youtube = stats?.platforms.youtube;
  const discord = stats?.platforms.discord;
  const instagram = stats?.platforms.instagram;

  return (
    <div className="social-page">
      <div className="so-bg" aria-hidden>
        <div className="so-bg-grad" />
        <div className="so-bg-orb o1" />
        <div className="so-bg-orb o2" />
      </div>
      <div className="so-shell">
        <div className="so-tools">
          <button
            type="button"
            className={`so-refresh ${refreshing ? "is-busy" : ""}`}
            onClick={refresh}
            disabled={refreshing || loading}
            aria-label={refreshing ? "Refreshing live stats" : "Refresh live stats"}
            title={failed ? "Couldn't refresh live stats" : "Refresh live stats"}
          >
            <RefreshIcon />
          </button>
        </div>

        <div className="so-grid">
          <SocialCard
            className="yt"
            url={youtube?.url ?? "https://youtube.com/@ks_warrior_pro"}
            icon={<YouTubeIcon />}
            title="YouTube"
            handle={`@${youtube?.handle ?? "ks_warrior_pro"}`}
            metric="subscribers"
            note="Tutorials & builds"
            stat={youtube}
            loading={loading}
          />

          <SocialCard
            className="discord"
            url={discord?.url ?? "https://discord.gg/jDG7tJrHrt"}
            icon={<DiscordIcon />}
            title="Discord"
            handle={discord?.handle ? `discord.gg/${discord.handle}` : "discord.gg/jDG7tJrHrt"}
            metric="members"
            note="Help & community"
            stat={discord}
            loading={loading}
          />

          <SocialCard
            className="insta"
            url={instagram?.url ?? "https://instagram.com/ks_warrior_pro"}
            icon={<InstagramIcon />}
            title="Instagram"
            handle={`@${instagram?.handle ?? "ks_warrior_pro"}`}
            metric="followers"
            note="Behind the scenes"
            stat={instagram}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
