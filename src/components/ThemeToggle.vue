<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="theme === 'light' ? '切换到深色主题' : '切换到浅色主题'"
    @click="toggleTheme"
  >
    <span class="theme-toggle__icon" aria-hidden="true">
      <svg
        v-if="theme === 'light'"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
      </svg>
      <svg
        v-else
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
    </span>
    <span class="theme-toggle__label">{{ theme === 'light' ? '深色' : '浅色' }}</span>
  </button>
</template>

<script setup>
import { useTheme } from '../composables/useTheme'

const { theme, toggleTheme } = useTheme()
</script>

<style scoped>
.theme-toggle {
  position: fixed;
  top: 18px;
  right: 20px;
  z-index: 100;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid var(--theme-toggle-border);
  background: var(--theme-toggle-bg);
  color: var(--text-primary);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  cursor: pointer;
  transition:
    transform var(--transition-fast),
    background var(--transition-fast),
    border-color var(--transition-fast);
}

.theme-toggle:hover {
  transform: translateY(-1px);
  background: var(--theme-toggle-bg-hover);
}

.theme-toggle__icon {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--theme-toggle-icon-bg);
  color: var(--accent);
}

.theme-toggle__label {
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1;
}

@media (max-width: 960px) {
  .theme-toggle {
    top: 14px;
    right: 16px;
    padding: 9px 12px;
  }

  .theme-toggle__label {
    display: none;
  }
}
</style>
