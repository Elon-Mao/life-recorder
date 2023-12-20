import { defineStore } from 'pinia'
import { User } from 'firebase/auth'
import { auth } from '@/config/firebase'

export const useUserStore = defineStore('user', {
  state: () => {
    const userString = localStorage.getItem('user')
    return {
      user: userString ? JSON.parse(userString) : auth.currentUser
    }
  },
  actions: {
    setUser(user: User | null) {
      this.user = user
      localStorage.setItem('user', JSON.stringify(user))
    }
  },
})