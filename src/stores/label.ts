import { defineStore } from 'pinia'
import { updateDoc, DocumentData } from 'firebase/firestore'
import { customAsync } from '@/common/customPromise'
import { useUserStore } from '@/stores/user'

export interface Label {
  id: string
  name: string
  recordNum: number
}

const saveLabels = async (labels: Label[], labelMaxId: number) => {
  await customAsync(() => {
    updateDoc(useUserStore().userDoc!, {
      labels: labels.map((label) => `${label.id},${label.name},${label.recordNum}`).join('\n'),
      labelMaxId
    })
  })
}

export const useLabelStore = defineStore('label', {
  state: () => {
    return {
      labels: [] as Label[],
      labelMaxId: 0
    }
  },
  actions: {
    setByDoc(doc: DocumentData) {
      this.labels = doc.labels.split('\n').map((labelStr: string) => {
        const [id, name, recordNum] = labelStr.split(',')
        return {
          id, name,
          recordNum: Number(recordNum)
        }
      })
      this.labelMaxId = doc.labelMaxId
    },
    async rename(index: number, newName: string) {
      const newLabels = [...this.labels]
      newLabels[index].name = newName
      await saveLabels(newLabels, this.labelMaxId)
    },
    async addLabel(labelName: string) {
      const newLabels = [...this.labels]
      const newId = this.labelMaxId + 1
      newLabels.unshift({
        id: newId + '',
        name: labelName,
        recordNum: 0
      })
      await saveLabels(newLabels, newId)
    },
    async deleteLabel(index: number) {
      const newLabels = [...this.labels]
      newLabels.splice(index, 1)
      await saveLabels(newLabels, this.labelMaxId)
    }
  },
})