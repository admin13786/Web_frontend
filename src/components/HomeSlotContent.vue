<template>
  <div class="slot-content">
    <h2 class="card-title">{{ title }}</h2>
    <p class="card-desc">{{ desc }}</p>
    <span
      v-if="card === 'channel'"
      class="card-arrow"
      @click.stop="$emit('navigate')"
    >→</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  card: { type: String, required: true }
})

defineEmits(['navigate'])

const content = {
  channel: { title: 'Channel', desc: '频道排行榜' },
  workshop: { title: 'Workshop', desc: '创意工作坊 · 探索与协作空间' },
  remain: { title: 'Remain', desc: '其他内容与资源' }
}

const title = computed(() => content[props.card]?.title || '')
const desc = computed(() => content[props.card]?.desc || '')
</script>

<style scoped>
.slot-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100%;
  height: 100%;
}

.card-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.card-desc {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.card-arrow {
  position: absolute;
  bottom: 24px;
  right: 24px;
  font-size: 1.25rem;
  color: var(--accent);
  opacity: 0.8;
  cursor: pointer;
  padding: 8px;
}

.card-arrow:hover {
  opacity: 1;
}
</style>
