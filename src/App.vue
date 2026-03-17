<template>
  <div class="app-container">
    <RouterView v-slot="{ Component, route }">
      <Transition name="slide" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
  </div>
</template>

<script setup>
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  overflow-x: hidden;
}
</style>
