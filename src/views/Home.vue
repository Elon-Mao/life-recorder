<script setup lang="ts">
import AppFooter from '@/components/AppFooter.vue'
</script>

<template>
  <div class="app-main">
    <RouterView/>
  </div>
  <app-footer></app-footer>
</template>

<style scoped>
.app-main {
  flex-grow: 1;
  overflow-y: auto;
}
</style>
