export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'dsqr-theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

const THEME_COLOR: Record<Theme, string> = { light: '#fdfdfd', dark: '#1a1b1e' }

export const themeScript = `(function () {
  var key = ${JSON.stringify(STORAGE_KEY)};
  var colors = ${JSON.stringify(THEME_COLOR)};
  var query = matchMedia(${JSON.stringify(DARK_QUERY)});
  function apply() {
    var stored = null;
    try { stored = localStorage.getItem(key); } catch (e) {}
    var theme = stored === 'light' || stored === 'dark' ? stored : query.matches ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', colors[theme]);
  }
  apply();
  query.addEventListener('change', apply);
})()`

function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
}

export function toggleTheme() {
  const next: Theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
  const system: Theme = matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
  try {
    if (next === system) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, next)
  } catch {}

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!reduceMotion && 'startViewTransition' in document) {
    document.startViewTransition(() => setTheme(next))
  } else {
    setTheme(next)
  }
}
