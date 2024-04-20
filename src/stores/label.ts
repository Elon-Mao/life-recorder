import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useElonStore } from './elonStore'

export interface Label {
  id?: string
  labelName?: string
  recordNum?: number
}

const storeId = 'labels'
export const useLabelStore = defineStore(storeId, () => {
  const elonStore = useElonStore<Label>(storeId, ['labelName', 'recordNum'])

  const setLabel = async (label: Label) => {
    if (label.id) {
      elonStore.setBrief(label)
    } else {
      elonStore.addEntity(label)
    }
    await elonStore.commit()
  }

  const deleteLabel = async(id: string) => {
    elonStore.deleteEntity(elonStore.entityMap[id])
    await elonStore.commit()
  }

  const setRecordNum = (id: string, addNum: number) => {
    const label = elonStore.entityMap[id]
    label.recordNum! += addNum
    elonStore.setBrief(label)
  }

  const labels = computed(() => {
    return elonStore.entities.value.sort((l0, l1) => l1.recordNum! - l0.recordNum!)
  })

  return {
    ...elonStore,
    setLabel,
    deleteLabel,
    setRecordNum,
    labels,
  }
})
