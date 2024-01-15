import { defineStore } from 'pinia'
import { User } from 'firebase/auth'
import { auth, db } from '@/config/firebase'
import { customAsync } from '@/config/customAsync'
import { doc, getDoc, setDoc, onSnapshot, DocumentData, DocumentReference } from 'firebase/firestore'
import { useLabelStore } from '@/stores/label'

type userDoc = DocumentReference<DocumentData, DocumentData> | null

export const useUserStore = defineStore('user', {
  state: () => {
    const userString = localStorage.getItem('user')
    return {
      user: userString ? JSON.parse(userString) : auth.currentUser,
      userDoc: null as userDoc,
    }
  },
  actions: {
    async setUser(user: User | null) {
      const success = () => {
        this.user = user
        localStorage.setItem('user', JSON.stringify(user))
        this.userDoc = userDoc
      }

      let userDoc: userDoc = null
      if (!user) {
        success()
        return
      }
      userDoc = doc(db, 'users', user.uid)
      const labelStore = useLabelStore()
      onSnapshot(userDoc, (doc) => {
        labelStore.setByDoc(doc.data()!)
      })

      await customAsync(async () => {
        const userSnapshot = await getDoc(userDoc!)
        if (!userSnapshot.exists()) {
          await setDoc(userDoc!, {
            labels: '1,Study,0\n2,Exercise,0\n3,Code,0',
            labelMaxId: 3
          }, { merge: true })
        }
      })
      success()
    }
  },
})