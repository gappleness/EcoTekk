(function () {
    var STORAGE_KEY = 'ecotekk-theme';
    var root = document.documentElement;

    function applyTheme(theme) {
        if (theme === 'dark') {
            root.setAttribute('data-theme', 'dark');
        } else {
            root.removeAttribute('data-theme');
        }
    }

    // Apply immediately (before paint) to avoid a light-mode flash.
    applyTheme(localStorage.getItem(STORAGE_KEY));

    document.addEventListener('DOMContentLoaded', function () {
        var btn = document.getElementById('theme-toggle');
        if (!btn) return;

        function sync() {
            var isDark = root.getAttribute('data-theme') === 'dark';
            btn.textContent = isDark ? '☀️' : '🌙';
            btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        }
        sync();

        btn.addEventListener('click', function () {
            var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            localStorage.setItem(STORAGE_KEY, next);
            sync();
        });
    });
})();