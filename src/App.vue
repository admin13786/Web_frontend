<template>
  <div class="app-container">
    <ThemeToggle />
    <RouterView />
  </div>
</template>

<script setup>
import ThemeToggle from './components/ThemeToggle.vue'
</script>

<style scoped>
.app-container {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
}
</style>
