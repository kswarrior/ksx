window.addEventListener('DOMContentLoaded', () => {
    // Check if top-level URL matches
    if (window.location.hostname === 'ksx.pages.dev') {
        // Save current page URL to element with id "ks-web-last-page"
        const lastPageElem = document.getElementById('ks-web-last-page');
        if (lastPageElem) {
            lastPageElem.textContent = window.location.href;
            // Optional: store in localStorage for persistence
            localStorage.setItem('ks-web-last-page', window.location.href);
        }

        // Redirect current tab to the other website
        window.location.href = 'https://ks.42web.io';
    }
});
