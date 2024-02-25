import { defineStore } from 'pinia'
import {
  collection,
  doc,
  query,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import customPromise from '@/common/customPromise'
import { useUserStore } from './user'

export interface Label {
  id?: string
  labelName: string
  recordNum: number
}

const userStore = useUserStore()
const labelCollection = collection(db, `users/${userStore.user.uid}/labels`)

const useLabelStore = defineStore('labels', {
  state: () => {
    return {
      labels: [] as Label[]
    }
  },
  actions: {
    init() {
      onSnapshot(query(labelCollection), (querySnapshot) => {
        this.labels = []
        querySnapshot.forEach((doc) => {
          this.labels.push({
            id: doc.id,
            ...doc.data()
          } as Label)
        })
        this.labels.sort((label0, label1) => label0.recordNum < label1.recordNum ? 1 : -1)
      })
    },
    async setById(label: Label) {
      const { id, ...labelData } = label
      await customPromise(setDoc(doc(labelCollection, id), labelData))
    },
    async addEntity(label: Label) {
      const newDoc = doc(labelCollection)
      await this.setById({
        id: newDoc.id,
        ...label
      })
      return newDoc.id
    },
    async deleteById(id: string) {
      await customPromise(deleteDoc(doc(labelCollection, id)))
    },
    async setRecordNum(id: string, addNum: number) {
      const label = {
        ...this.labels.find((label) => label.id === id)!
      }
      label.recordNum += addNum
      await this.setById(label)
    },
  }
})

useLabelStore().init()

export { useLabelStore }