<script setup lang="ts">
import AppFooter from '@/components/AppFooter.vue'
</script>

<template>
  <div class="app-main">
    <RouterView v-slot="{ Component }">
      <KeepAlive>
        <component :is="Component" />
      </KeepAlive>
    </RouterView>
  </div>
  <app-footer class="app-footer"></app-footer>
</template>

<style scoped>
.app-main {
  flex-grow: 1;
  height: 0;
}

.app-footer {
  flex-shrink: 0;
}
</style>
