import { defineStore } from 'pinia'
import customPromise from '@/common/customPromise'
import { useUserStore } from './user'
import { elonStore } from './elonStore'

export interface Label {
  id?: string
  labelName?: string
  recordNum?: number
}

let baseStore

export const useLabelStore = defineStore('labelsExtends', {
  state: () => {
    return {
      labelMap: {} as Record<string, Label>,
      labels: [] as Label[]
    }
  },
  actions: {
    async init() {
      const useElonStore = elonStore<Label>('labels', useUserStore().getAppCollection(), ['labelName', 'recordNum'])
      baseStore = useElonStore()
      await customPromise(baseStore.init())
      this.labelMap = baseStore.entityMap
      this.labels = baseStore.entities.sort((l0, l1) => l1.recordNum! - l0.recordNum!)
    },
    async setById(label: Label) {
      await customPromise(baseStore!.setEntity(label))
    },
    async addEntity(label: Label) {
      await customPromise(baseStore!.addEntity(label))
    },
    async deleteById(id: string) {
      await customPromise(baseStore!.deleteEntity(baseStore!.entityMap[id]))
    },
    async setRecordNum(id: string, addNum: number) {
      const label = baseStore!.entityMap[id]
      label.recordNum! += addNum
      await this.setById(label)
    },
  }
})