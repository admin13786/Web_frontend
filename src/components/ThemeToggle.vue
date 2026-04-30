<template>
  <div class="quick-actions">
    <a
      v-if="androidApkUrl"
      class="quick-action quick-action--download"
      :href="androidApkUrl"
      download="lingjing-android-latest.apk"
      aria-label="下载安卓客户端安装包"
      title="下载安卓客户端"
    >
      <span class="quick-action__icon quick-action__icon--download" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="7" y="2.8" width="10" height="18.4" rx="2.5" />
          <path d="M12 7.5v6.5" />
          <path d="m9.5 11.5 2.5 2.5 2.5-2.5" />
          <path d="M10 18h4" />
        </svg>
      </span>
      <span class="quick-action__label">安卓下载</span>
    </a>

    <button
      type="button"
      class="quick-action quick-action--theme"
      :aria-label="theme === 'light' ? '切换到深色主题' : '切换到浅色主题'"
      @click="toggleTheme"
    >
      <span class="quick-action__icon" aria-hidden="true">
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
      <span class="quick-action__label">{{ theme === 'light' ? '夜色' : '暖光' }}</span>
    </button>
  </div>
</template>

<script setup>
import { ANDROID_APK_URL } from '../config'
import { useTheme } from '../composables/useTheme'

const { theme, toggleTheme } = useTheme()
const androidApkUrl = ANDROID_APK_URL
</script>

<style scoped>
.quick-actions {
  position: fixed;
  top: 18px;
  right: 20px;
  z-index: 100;
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.quick-action {
  position: relative;
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
  overflow: hidden;
  text-decoration: none;
  transition:
    transform var(--transition-fast),
    background var(--transition-fast),
    border-color var(--transition-fast);
}

.quick-action::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.12), transparent 46%),
    radial-gradient(circle at 18% 20%, rgba(201, 138, 74, 0.12), transparent 28%);
  pointer-events: none;
}

.quick-action:hover {
  transform: translateY(-1px);
  background: var(--theme-toggle-bg-hover);
}

.quick-action__icon {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--theme-toggle-icon-bg);
  color: var(--accent);
  position: relative;
  z-index: 1;
}

.quick-action__icon--download {
  color: var(--support-olive);
  background: rgba(111, 123, 92, 0.18);
}

.quick-action__label {
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1;
  position: relative;
  z-index: 1;
}

.quick-action--theme {
  border: 1px solid var(--theme-toggle-border);
}

[data-theme='dark'] .quick-action::after {
  background:
    linear-gradient(180deg, rgba(255, 244, 228, 0.05), transparent 44%),
    radial-gradient(circle at 18% 20%, rgba(201, 138, 74, 0.16), transparent 26%);
}

[data-theme='dark'] .quick-action__icon--download {
  background: rgba(156, 166, 134, 0.22);
  color: #dce7c7;
}

@media (max-width: 960px) {
  .quick-actions {
    top: 14px;
    right: 16px;
    gap: 10px;
  }

  .quick-action {
    padding: 9px 12px;
  }

  .quick-action__label {
    display: none;
  }
}
</style>
