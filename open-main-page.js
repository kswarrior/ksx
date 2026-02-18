window.addEventListener('DOMContentLoaded', () => {
    try {
        const topUrl = window.top.location.href;
        const urlObj = new URL(topUrl);

        const isKsx = urlObj.hostname === 'ksx.pages.dev';
        const hasPath = urlObj.pathname !== '/' && urlObj.pathname !== '';

        if (isKsx && hasPath) {

            /* --------------------------
               INJECT CSS
            ---------------------------*/
            const style = document.createElement('style');
            style.innerHTML = `
                .ks-topbar{
                  position:fixed;
                  top:0;
                  left:0;
                  width:100%;
                  padding:14px 22px;
                  display:flex;
                  justify-content:space-between;
                  align-items:center;
                  gap:20px;
                  z-index:99999;
                  background:rgba(18,18,28,0.85);
                  backdrop-filter:blur(20px);
                  border-bottom:1px solid rgba(255,255,255,0.12);
                  box-shadow:0 0 20px rgba(255,255,255,0.15);
                  animation:ksSlideDown 0.6s cubic-bezier(0.22,1,0.36,1);
                  font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;
                }

                .ks-topbar-text{
                  font-size:14px;
                  font-weight:600;
                  color:#ffffff;
                }

                .ks-topbar-actions{
                  display:flex;
                  gap:12px;
                }

                .ks-btn{
                  padding:8px 18px;
                  border-radius:999px;
                  border:1px solid rgba(255,255,255,0.12);
                  background:rgba(28,28,40,0.9);
                  color:#ffffff;
                  font-size:13px;
                  cursor:pointer;
                  transition:0.4s ease;
                }

                .ks-btn:hover{
                  background:rgba(40,40,55,0.95);
                  transform:scale(1.05);
                  box-shadow:0 0 15px rgba(255,255,255,0.4);
                }

                .ks-btn-confirm{
                  background:#ffffff;
                  color:#000;
                  font-weight:700;
                }

                .ks-btn-confirm:hover{
                  transform:scale(1.08);
                  box-shadow:0 0 20px rgba(255,255,255,0.4);
                }

                @keyframes ksSlideDown{
                  from{ transform:translateY(-100%); opacity:0; }
                  to{ transform:translateY(0); opacity:1; }
                }
            `;
            document.head.appendChild(style);

            /* --------------------------
               CREATE BAR
            ---------------------------*/
            const bar = document.createElement('div');
            bar.className = 'ks-topbar';

            bar.innerHTML = `
                <div class="ks-topbar-text">
                    Continue to main site?
                </div>
                <div class="ks-topbar-actions">
                    <button class="ks-btn" id="ks-close">✕</button>
                    <button class="ks-btn ks-btn-confirm" id="ks-confirm">
                        Confirm
                    </button>
                </div>
            `;

            document.body.appendChild(bar);
            document.body.style.marginTop = bar.offsetHeight + 'px';

            /* --------------------------
               BUTTON ACTIONS
            ---------------------------*/
            document.getElementById('ks-close').onclick = () => {
                bar.remove();
                document.body.style.marginTop = '0';
            };

            document.getElementById('ks-confirm').onclick = () => {
                localStorage.setItem('ks-web-last-page', topUrl);
                window.top.location.href = 'https://ksx.pages.dev';
            };
        }

    } catch (err) {
        console.error(err);
    }
});
