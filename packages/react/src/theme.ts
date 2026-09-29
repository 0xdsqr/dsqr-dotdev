// Theme state lives on <html data-theme="light|dark">, which globals.css maps to
// `color-scheme` (and so every light-dark() token). With no stored choice the
// page follows the system; a stored choice overrides it. React never renders
// the attribute, so hydration and re-renders leave it alone.

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'dsqr-theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

// sRGB equivalents of the `ground` token, for the browser chrome.
const THEME_COLOR: Record<Theme, string> = { light: '#fdfdfd', dark: '#1a1b1e' }

// Inlined in <head> so the right theme paints first, then follows the system
// live whenever no choice is stored. Plain ES5 in a string: it runs before any
// bundle, and minifiers cannot rename what it references.
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
    // Choosing what the system already shows means "follow the system" again.
    if (next === system) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, next)
  } catch {}

  // One calm crossfade between themes, where supported and motion is welcome.
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!reduceMotion && 'startViewTransition' in document) {
    document.startViewTransition(() => setTheme(next))
  } else {
    setTheme(next)
  }
}
