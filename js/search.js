document.addEventListener("DOMContentLoaded", () => {
    // ----- element refs -----
    // works with id="uv-address" (search page) OR id="search" / id="searchbar2" (other pages)
    const searchInput = document.getElementById("uv-address")
        || document.getElementById("search")
        || document.getElementById("searchbar2");
    const searchFrame = document.getElementById("searchframe");
    const searchForm  = document.querySelector("#uv-form");

    // ----- simple encode/decode for URL params (no UV dependency) -----
    const orbitEncode = (str) => btoa(encodeURIComponent(str));
    const orbitDecode = (str) => {
        try { return decodeURIComponent(atob(str)); } catch { return null; }
    };

    // ----- register UV service worker when ready -----
    const registerUV = async () => {
        const uv = window.__uv$config;  // double-underscore — matches orb/config.js
        if (!uv) return;
        try {
            await navigator.serviceWorker.register("/orb/sw.js", { scope: uv.prefix });
        } catch (e) {
            console.warn("UV service worker failed:", e);
        }
    };

    // ----- build iframe src, using UV proxy if available -----
    const buildSrc = (url) => {
        const uv = window.__uv$config;
        if (uv) return uv.prefix + uv.encodeUrl(url);
        return url;  // fallback: load directly (may be blocked by X-Frame-Options on some sites)
    };

    // ----- core search function -----
    const performSearch = (rawQuery, isInitialLoad = false) => {
        if (!rawQuery || !rawQuery.trim()) return;

        let query = rawQuery.trim();

        // turn "example.com" into "https://example.com"
        const looksLikeDomain = /^[^\s]+\.[^\s]+$/.test(query)
            && !query.startsWith("http");
        if (looksLikeDomain) query = "https://" + query;

        const isUrl = query.startsWith("http://") || query.startsWith("https://");

        // pick target URL: direct URL → proxy it, plain text → Bing search
        const targetUrl = isUrl
            ? buildSrc(query)
            : buildSrc(`https://www.bing.com/search?q=${encodeURIComponent(rawQuery)}`);

        // update address bar display
        if (searchInput) searchInput.value = query;

        // load in iframe (no page navigation)
        if (searchFrame) searchFrame.src = targetUrl;

        // update browser URL so back/forward work
        const encoded = orbitEncode(query);
        if (!isInitialLoad) {
            if (window.location.pathname.includes("search.htM")) {
                window.history.pushState({ q: encoded }, "", `search.htM?q=${encoded}`);
            } else {
                window.location.href = `search.htM?q=${encoded}`;
            }
        }
    };

    // ----- restore previous search on page load -----
    const params = new URLSearchParams(window.location.search);
    const initialEncrypted = params.get("q");
    if (initialEncrypted) {
        const decrypted = orbitDecode(initialEncrypted);
        if (decrypted) performSearch(decrypted, true);
    }

    // ----- form submit (Enter key or submit button) -----
    if (searchForm) {
        searchForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            await registerUV();              // ensure SW is registered before first proxy use
            performSearch(searchInput?.value);
        });
    }

    // ----- back / forward / refresh buttons -----
    document.getElementById("back")?.addEventListener("click", () => history.back());
    document.getElementById("forward")?.addEventListener("click", () => history.forward());
    document.getElementById("refresh")?.addEventListener("click", () => {
        if (searchFrame) searchFrame.src = searchFrame.src;
    });

    // ----- handle browser back/forward -----
    window.addEventListener("popstate", () => {
        const p = new URLSearchParams(window.location.search);
        const enc = p.get("q");
        if (enc) {
            const dec = orbitDecode(enc);
            if (dec) performSearch(dec, true);
        }
    });

    // ----- try to sync address bar with iframe URL (same-origin only) -----
    if (searchFrame && searchInput) {
        searchFrame.addEventListener("load", () => {
            try {
                const url = searchFrame.contentWindow.location.href;
                if (url && url !== "about:blank") searchInput.value = url;
            } catch {
                // cross-origin: this is expected, ignore it
            }
        });
    }
});
