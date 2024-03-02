import { defineStore } from 'pinia'
import {
  doc,
  query,
  setDoc,
  deleteDoc,
  onSnapshot,
  CollectionReference,
  DocumentData
} from 'firebase/firestore'
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
      onSnapshot(query(useUserStore().getLabelsCollection()), (querySnapshot) => {
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
      await customPromise(setDoc(doc(useUserStore().getLabelsCollection(), id), labelData))
    },
    async addEntity(label: Label) {
      const newDoc = doc(useUserStore().getLabelsCollection())
      await this.setById({
        id: newDoc.id,
        ...label
      })
      return newDoc.id
    },
    async deleteById(id: string) {
      await customPromise(deleteDoc(doc(useUserStore().getLabelsCollection(), id)))
    },
    async setRecordNum(id: string, addNum: number) {
      const label = {
        ...this.labels.find((label) => label.id === id)!
      }
      label.recordNum += addNum
      await this.setById(label)
    },
    async deleteAll() {
      await Promise.all(this.labels.map((label) => deleteDoc(doc(useUserStore().getLabelsCollection(), label.id))))
    }
  }
})