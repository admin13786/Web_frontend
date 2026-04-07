import { ref, watch } from 'vue'

const THEME_STORAGE_KEY = 'app-theme'
const DEFAULT_THEME = 'light'
const theme = ref(DEFAULT_THEME)

let initialized = false

function applyTheme(value) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', value)
}

function initTheme() {
  if (initialized) return

  let nextTheme = DEFAULT_THEME

  if (typeof window !== 'undefined') {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (savedTheme === 'light' || savedTheme === 'dark') {
      nextTheme = savedTheme
    }
  }

  theme.value = nextTheme
  applyTheme(nextTheme)

  watch(theme, (value) => {
    applyTheme(value)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, value)
    }
  })

  initialized = true
}

export function useTheme() {
  initTheme()

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  return {
    theme,
    toggleTheme,
  }
}
