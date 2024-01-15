import { defineStore } from 'pinia'

export const useSystemStore = defineStore('system', {
  state: () => {
    return {
      loading: true
    }
  },
  actions: {
    setLoading(loading: boolean) {
      this.loading = loading
    }
  }
})