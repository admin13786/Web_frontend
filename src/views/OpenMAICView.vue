<template>
  <div class="openmaic-view">
    <div class="openmaic-shell">
      <div v-if="loadState === 'error'" class="openmaic-fallback">
        <h2>当前页面无法稳定内嵌</h2>
        <p>可能是 OpenMAIC 的安全策略禁止 iframe，或者当前会话跳转到了外部页面。</p>
        <div class="openmaic-actions">
          <a
            class="openmaic-link"
            :href="openmaicUrl"
            target="_blank"
            rel="noreferrer noopener"
          >
            直接打开 OpenMAIC
          </a>
          <button type="button" class="openmaic-link openmaic-link--secondary" @click="reloadFrame">
            重新尝试内嵌
          </button>
        </div>
      </div>

      <iframe
        v-else
        ref="iframeEl"
        :key="frameKey"
        class="openmaic-frame"
        :src="embedUrl"
        title="OpenMAIC"
        @load="handleLoad"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useTheme } from '../composables/useTheme'
import { getOpenMAICAppUrl } from '../config.js'

const openmaicUrl = getOpenMAICAppUrl()
const { theme } = useTheme()
const iframeEl = ref(null)
const frameKey = ref(0)
const loadState = ref('loading')

const embedUrl = computed(() => {
  try {
    const url = new URL(openmaicUrl, window.location.href)
    url.searchParams.set('theme', theme.value)
    url.searchParams.set('appearance', theme.value)
    url.searchParams.set('hostTheme', theme.value)
    return url.toString()
  } catch {
    return openmaicUrl
  }
})

const targetOrigin = computed(() => {
  try {
    return new URL(openmaicUrl, window.location.href).origin
  } catch {
    return '*'
  }
})

function reloadFrame() {
  loadState.value = 'loading'
  frameKey.value += 1
}

function syncIframeTheme() {
  iframeEl.value?.contentWindow?.postMessage(
    {
      type: 'openmaic:set-theme',
      theme: theme.value,
    },
    targetOrigin.value,
  )
}

function handleLoad() {
  loadState.value = 'ready'
  syncIframeTheme()
}

watch(theme, () => {
  loadState.value = 'loading'
  frameKey.value += 1
  syncIframeTheme()
})

const loadTimeout = window.setTimeout(() => {
  if (loadState.value === 'loading') {
    loadState.value = 'error'
  }
}, 5000)

onBeforeUnmount(() => {
  window.clearTimeout(loadTimeout)
})
</script>

<style scoped>
.openmaic-view {
  min-height: 100%;
}

.openmaic-shell {
  min-height: calc(100vh - 48px);
  border-radius: 28px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  box-shadow: var(--shadow-soft);
}

.openmaic-frame {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 48px);
  border: none;
  background: #fff;
}

.openmaic-fallback {
  min-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 24px;
  text-align: center;
  color: var(--text-secondary);
}

.openmaic-fallback h2 {
  color: var(--text-primary);
}

.openmaic-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.openmaic-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  border-radius: 14px;
  padding: 11px 16px;
  border: 1px solid rgba(129, 140, 248, 0.28);
  background: rgba(99, 102, 241, 0.18);
  color: var(--text-primary);
  cursor: pointer;
}

.openmaic-link--secondary {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.12);
}
</style>
