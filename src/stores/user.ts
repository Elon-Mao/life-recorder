import router from '@/router'
import { defineStore } from 'pinia'
import { auth, db } from '@/config/firebase'
import { useSystemStore } from '@/stores/system'
import { useLabelStore } from '@/stores/label'
import type { User } from 'firebase/auth'
import { collection } from 'firebase/firestore'
import { useRecordStore } from './recordData'

const appName = 'life-recorder'

export const useUserStore = defineStore('user', {
  state: () => {
    const userString = localStorage.getItem('user')
    return {
      user: userString ? JSON.parse(userString) : auth.currentUser,
    }
  },
  actions: {
    async setUser(user: User | null) {
      if (!user) {
        localStorage.removeItem('user')
        router.push({ name: 'Portal'})
        this.user = user
        useSystemStore().setLoading(false)
        return
      }

      localStorage.setItem('user', JSON.stringify(user))
      router.push({ name: 'Home'})
      this.user = user
      await useLabelStore().init(this.getAppCollection())
      await useRecordStore().init(this.getAppCollection())
      useSystemStore().setLoading(false)
    },
    getAppCollection() {
      return collection(db, `users/${this.user.uid}/${appName}`)
    }
  },
})