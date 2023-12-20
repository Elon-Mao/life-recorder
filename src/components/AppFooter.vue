<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Tabbar, TabbarItem } from 'vant'

const route = useRoute()
const router = useRouter()
const active = computed({
  get: () => String(route.name),
  set: (newValue) => router.push(newValue)
})
</script>

<template>
  <tabbar v-model="active">
    <tabbar-item name="Today" icon="home-o">Today</tabbar-item>
    <tabbar-item name="Event" icon="search">Event</tabbar-item>
    <tabbar-item name="Analysis" icon="friends-o">Analysis</tabbar-item>
  </tabbar>
</template>

<style scoped></style>
