import router from '@/router'
import { defineStore } from 'pinia'
import { auth } from '@/config/firebase'
import { useSystemStore } from '@/stores/system'
import type { User } from 'firebase/auth'

export const useUserStore = defineStore('user', {
  state: () => {
    const userString = localStorage.getItem('user')
    return {
      user: userString ? JSON.parse(userString) : auth.currentUser,
    }
  },
  actions: {
    async setUser(user: User | null) {
      const success = () => {
        this.user = user
        useSystemStore().setLoading(false)
      }

      if (!user) {
        localStorage.removeItem('user')
        router.push({ name: 'Portal'})
        success()
        return
      }

      localStorage.setItem('user', JSON.stringify(user))
      success()
    }
  },
})