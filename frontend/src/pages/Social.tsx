import "./Social.css";

export default function Social() {
  return (
    <main className="social-main">
      <div className="social-stats">
        <a href="https://youtube.com/@ks_warrior_pro" target="_blank" rel="noreferrer" className="social-card yt">
          <div className="social-logo">
            <svg viewBox="0 0 24 24">
              <path d="M23.5 6.2s-.2-1.7-.9-2.4c-.8-.9-1.7-.9-2.1-1C17.6 2.5 12 2.5 12 2.5s-5.6 0-8.5.3c-.4.1-1.3.1-2.1 1C.7 4.5.5 6.2.5 6.2S.3 8.2.3 10.2v1.6c0 2 .2 4 .2 4s.2 1.7.9 2.4c.8.9 1.9.9 2.4 1 1.7.2 7.2.3 7.2.3s5.6 0 8.5-.3c.4-.1 1.3-.1 2.1-1 .7-.7.9-2.4.9-2.4s.2-2 .2-4v-1.6c0-2-.2-4-.2-4z" fill="#FF0000" />
              <path d="M9.75 14.02l4.92-2.83-4.92-2.83v5.66z" fill="#fff" />
            </svg>
          </div>
          <div className="social-content">
            <h3>YouTube</h3>
            <p>Subscribers: 135+</p>
          </div>
        </a>

        <a href="https://discord.gg/2kAYnH655h" target="_blank" rel="noreferrer" className="social-card discord">
          <div className="social-logo">
            <svg viewBox="0 0 24 24">
              <path fill="#5865F2" d="M20.3 4.4A19.8 19.8 0 0 0 15.8 3l-.2.4a18 18 0 0 1 4.1 1.6 14.7 14.7 0 0 0-15.4 0A18 18 0 0 1 8.4 3l-.2-.4A19.8 19.8 0 0 0 3.7 4.4C.8 8.7 1.1 13 1.1 13s1.6 2.8 5.7 3c0 0 .7-.9 1.3-1.6a8.6 8.6 0 0 1-2.5-1.2c.2.1.4.2.6.3 3.3 1.6 7.4 1.6 10.7 0 .2-.1.4-.2.6-.3a8.6 8.6 0 0 1-2.5 1.2c.6.7 1.3 1.6 1.3 1.6 4.1-.2 5.7-3 5.7-3s.3-4.3-2.6-8.6z" />
              <circle cx="9" cy="10" r="1.3" fill="#fff" />
              <circle cx="15" cy="10" r="1.3" fill="#fff" />
            </svg>
          </div>
          <div className="social-content">
            <h3>Discord</h3>
            <p>Members: 1250+</p>
          </div>
        </a>

        <a href="https://instagram.com/ks_warrior_pro" target="_blank" rel="noreferrer" className="social-card insta">
          <div className="social-logo">
            <svg viewBox="0 0 24 24">
              <defs>
                <linearGradient id="ig" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F58529" />
                  <stop offset="50%" stopColor="#DD2A7B" />
                  <stop offset="100%" stopColor="#515BD4" />
                </linearGradient>
              </defs>
              <rect x="3" y="3" width="18" height="18" rx="5" fill="url(#ig)" />
              <circle cx="12" cy="12" r="4" fill="none" stroke="#fff" strokeWidth={2} />
              <circle cx="17" cy="7" r="1.3" fill="#fff" />
            </svg>
          </div>
          <div className="social-content">
            <h3>Instagram</h3>
            <p>Followers: 10+</p>
          </div>
        </a>
      </div>
    </main>
  );
}
