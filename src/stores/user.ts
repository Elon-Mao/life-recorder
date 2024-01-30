import { defineStore } from 'pinia'
import { User } from 'firebase/auth'
import { auth, db } from '@/config/firebase'
import { customAsync } from '@/common/customPromise'
import { doc, getDoc, setDoc, onSnapshot, DocumentReference, collection, CollectionReference } from 'firebase/firestore'
import { useLabelStore } from '@/stores/label'
import { useSystemStore } from '@/stores/system'
import router from '@/router'

type UserDoc = DocumentReference | null
type RecordsCollection = CollectionReference | null

export const useUserStore = defineStore('user', {
  state: () => {
    const userString = localStorage.getItem('user')
    return {
      user: userString ? JSON.parse(userString) : auth.currentUser,
      userDoc: null as UserDoc,
      recordsCollection: null as RecordsCollection
    }
  },
  actions: {
    async setUser(user: User | null) {
      const success = () => {
        this.user = user
        this.userDoc = userDoc
        this.recordsCollection = recordsCollection
        useSystemStore().setLoading(false)
      }

      let userDoc: UserDoc = null
      let recordsCollection: RecordsCollection = null
      if (!user) {
        localStorage.removeItem('user')
        router.push({ name: 'Portal'})
        success()
        return
      }
      userDoc = doc(db, 'users', user.uid)
      recordsCollection = collection(userDoc, 'records')
      const labelStore = useLabelStore()
      onSnapshot(userDoc, (newDoc) => {
        labelStore.setByDoc(newDoc.data()!)
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
      localStorage.setItem('user', JSON.stringify(user))
      router.push({ name: 'Record'})
      success()
    }
  },
})