import { defineStore } from 'pinia'

let loadingTimeoutId: NodeJS.Timeout

export const useSystemStore = defineStore('system', {
  state: () => {
    return {
      loading: true
    }
  },
  actions: {
    setLoading(loading: boolean) {
      if (loading) {
        this.loading = loading
        return
      }
      clearTimeout(loadingTimeoutId)
      loadingTimeoutId = setTimeout(() => {
        this.loading = loading
      }, 300)
    }
  }
})