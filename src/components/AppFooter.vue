<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Tabbar as VanTabbar,
  TabbarItem as VanTabbarItem
} from 'vant'

const route = useRoute()
const router = useRouter()
const active = computed({
  get: () => String(route.name),
  set: (newValue) => router.push(newValue)
})
</script>

<template>
  <van-tabbar v-model="active">
    <van-tabbar-item name="Record" icon="records">Record</van-tabbar-item>
    <van-tabbar-item name="Label" icon="cluster">Label</van-tabbar-item>
    <van-tabbar-item name="Analysis" icon="chart-trending-o">Analysis</van-tabbar-item>
  </van-tabbar>
</template>

<style scoped></style>
