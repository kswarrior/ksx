window.addEventListener('DOMContentLoaded', () => {
    try {
        // Get the top-level URL
        const topUrl = top.location.href;

        // Check if top-level URL contains "ksx.pages.dev"
        if (topUrl.includes('ks.pages.dev')) {
            // Save current page URL to element with id "ks-web-last-page"
            const lastPageElem = document.getElementById('ks-web-last-page');
            if (lastPageElem) {
                lastPageElem.textContent = topUrl;
                // Optional: store in localStorage for persistence
                localStorage.setItem('ks-web-last-page', topUrl);
            }

            // Redirect top-level window to the other website
            top.location.href = 'https://ks.42web.io';
        }
    } catch (err) {
        console.error('Cannot access top-level window URL:', err);
    }
});
