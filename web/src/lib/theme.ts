export type Theme = 'light' | 'dark'

// index.html applies the saved theme before first paint; this reads and changes it.
export const currentTheme = (): Theme =>
  document.documentElement.classList.contains('dark') ? 'dark' : 'light'

export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem('theme', theme)
  } catch {
    // Storage blocked: the theme still applies until the page reloads
  }
}
