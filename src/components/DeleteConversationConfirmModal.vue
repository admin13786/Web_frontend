<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="delete-conv-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-conv-modal-title"
    >
      <div class="delete-conv-modal__backdrop" @click="handleCancel" />
      <div class="delete-conv-modal__panel" @click.stop>
        <header class="delete-conv-modal__header">
          <h2 id="delete-conv-modal-title" class="delete-conv-modal__title">要删除对话吗？</h2>
          <button
            type="button"
            class="delete-conv-modal__close"
            aria-label="关闭"
            @click="handleCancel"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>
        <p class="delete-conv-modal__body">删除后，对话记录将不可恢复。</p>
        <footer class="delete-conv-modal__footer">
          <button type="button" class="delete-conv-modal__btn delete-conv-modal__btn--cancel" @click="handleCancel">
            取消
          </button>
          <button type="button" class="delete-conv-modal__btn delete-conv-modal__btn--danger" @click="handleConfirm">
            删除
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { watch, onBeforeUnmount } from 'vue'

const open = defineModel('open', { type: Boolean, default: false })

const emit = defineEmits(['confirm', 'cancel'])

let escHandler = null

function detachEsc() {
  if (escHandler) {
    document.removeEventListener('keydown', escHandler)
    escHandler = null
  }
}

function handleCancel() {
  emit('cancel')
  open.value = false
}

function handleConfirm() {
  emit('confirm')
  open.value = false
}

watch(open, (isOpen) => {
  detachEsc()
  if (!isOpen) return
  escHandler = (e) => {
    if (e.key === 'Escape') handleCancel()
  }
  document.addEventListener('keydown', escHandler)
})

onBeforeUnmount(() => detachEsc())
</script>

<style scoped>
.delete-conv-modal {
  position: fixed;
  inset: 0;
  z-index: 100020;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
}

.delete-conv-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(10, 11, 18, 0.72);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.delete-conv-modal__panel {
  position: relative;
  width: min(400px, 100%);
  padding: 22px 22px 20px;
  border-radius: 14px;
  background: #252525;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(0, 0, 0, 0.2) inset;
}

.delete-conv-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.delete-conv-modal__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #f4f4f5;
  line-height: 1.35;
}

.delete-conv-modal__close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  margin: -6px -6px 0 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(228, 228, 231, 0.55);
  cursor: pointer;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}

.delete-conv-modal__close:hover {
  color: #f4f4f5;
  background: rgba(255, 255, 255, 0.06);
}

.delete-conv-modal__body {
  margin: 0 0 22px;
  font-size: 0.875rem;
  line-height: 1.55;
  color: rgba(212, 212, 216, 0.85);
}

.delete-conv-modal__footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}

.delete-conv-modal__btn {
  min-height: 38px;
  padding: 0 18px;
  border: none;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s ease,
    opacity 0.15s ease;
}

.delete-conv-modal__btn--cancel {
  background: #3a3a3e;
  color: #fafafa;
}

.delete-conv-modal__btn--cancel:hover {
  background: #45454a;
}

.delete-conv-modal__btn--danger {
  background: #e53935;
  color: #fff;
}

.delete-conv-modal__btn--danger:hover {
  background: #ef5350;
}
</style>
