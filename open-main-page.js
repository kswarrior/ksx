window.addEventListener('DOMContentLoaded', () => {
    try {
        const topUrl = window.top.location.href;
        const urlObj = new URL(topUrl);

        const isKsx = urlObj.hostname === 'ksx.pages.dev';
        const hasPath = urlObj.pathname !== '/' && urlObj.pathname !== '';

        // Show bar only if ksx.pages.dev/anything
        if (isKsx && hasPath) {

            // Create top bar
            const bar = document.createElement('div');
            bar.style.position = 'fixed';
            bar.style.top = '0';
            bar.style.left = '0';
            bar.style.width = '100%';
            bar.style.background = '#111';
            bar.style.color = '#fff';
            bar.style.padding = '10px';
            bar.style.display = 'flex';
            bar.style.justifyContent = 'space-between';
            bar.style.alignItems = 'center';
            bar.style.zIndex = '9999';
            bar.style.fontFamily = 'Arial';

            bar.innerHTML = `
                <span>This page is opened from sub path</span>
                <div>
                    <button id="ks-close" style="margin-right:10px;">✖</button>
                    <button id="ks-confirm">Confirm</button>
                </div>
            `;

            document.body.appendChild(bar);

            // Add body margin so content not hidden
            document.body.style.marginTop = '50px';

            // Cross button → remove bar
            document.getElementById('ks-close').onclick = () => {
                bar.remove();
                document.body.style.marginTop = '0';
            };

            // Confirm button → save + redirect to main
            document.getElementById('ks-confirm').onclick = () => {
                localStorage.setItem('ks-web-last-page', topUrl);
                window.top.location.href = 'https://ksx.pages.dev';
            };
        }

    } catch (err) {
        console.error('Error:', err);
    }
});
