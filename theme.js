(function () {
    'use strict';
    var STORAGE_KEY = 'ecotekk-theme';
    var root = document.documentElement;

    function readTheme() {
        try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
    }
    function saveTheme(theme) {
        try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* Private browsing may block storage. */ }
    }
    function applyTheme(theme) {
        if (theme === 'dark') root.setAttribute('data-theme', 'dark');
        else root.removeAttribute('data-theme');
    }
    function syncButton(btn) {
        var isDark = root.getAttribute('data-theme') === 'dark';
        btn.textContent = isDark ? '☀' : '◐';
        btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        btn.setAttribute('aria-pressed', String(isDark));
        btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    }

    // Apply before paint to prevent a flash of the wrong theme.
    applyTheme(readTheme());

    document.addEventListener('DOMContentLoaded', function () {
        var btn = document.getElementById('theme-toggle');
        if (!btn) return;
        syncButton(btn);
        btn.addEventListener('click', function () {
            var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            saveTheme(next);
            syncButton(btn);
        });
    });
})();
