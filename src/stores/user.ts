import router from '@/router'
import { defineStore } from 'pinia'
import { auth, db } from '@/config/firebase'
import { useSystemStore } from '@/stores/system'
import { useLabelStore } from '@/stores/label'
import type { User } from 'firebase/auth'
import { collection } from 'firebase/firestore'

const projectPath = '/life-recorder/infos/'

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
      router.push({ name: 'Home'})
      useLabelStore().init()
      success()
    },
    getLabelsCollection() {
      return collection(db, `users/${this.user.uid}${projectPath}labels`)
    },
    getRecordsCollection() {
      return collection(db, `users/${this.user.uid}${projectPath}records`)
    }
  },
})