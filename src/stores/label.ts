import { defineStore } from 'pinia'
import {
  collection,
  doc,
  query,
  setDoc,
  deleteDoc,
  onSnapshot,
  CollectionReference,
  DocumentData
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import customPromise from '@/common/customPromise'
import { useUserStore } from './user'

export interface Label {
  id?: string
  labelName: string
  recordNum: number
}

export const useLabelStore = defineStore('labels', {
  state: () => {
    return {
      labels: [] as Label[],
      labelCollection: null as unknown as CollectionReference<DocumentData, DocumentData>
    }
  },
  actions: {
    init() {
      this.labelCollection = collection(db, `users/${useUserStore().user.uid}/labels`)
      onSnapshot(query(this.labelCollection), (querySnapshot) => {
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
      await customPromise(setDoc(doc(this.labelCollection, id), labelData))
    },
    async addEntity(label: Label) {
      const newDoc = doc(this.labelCollection)
      await this.setById({
        id: newDoc.id,
        ...label
      })
      return newDoc.id
    },
    async deleteById(id: string) {
      await customPromise(deleteDoc(doc(this.labelCollection, id)))
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