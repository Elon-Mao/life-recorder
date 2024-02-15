<script setup lang="ts">
import {
  Overlay as VanOverlay,
  Loading as VanLoading
} from 'vant'
import AppHeader from '@/components/AppHeader.vue'
import { useSystemStore } from '@/stores/system'

const systemStore = useSystemStore()
</script>

<template>
  <app-header></app-header>
  <RouterView />
  <van-overlay :show="systemStore.loading" :z-index="2147483647">
    <div class="loading-wrapper">
      <van-loading type="spinner" />
    </div>
  </van-overlay>
</template>

<style scoped>
.loading-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
</style>
