import { defineStore } from 'pinia'
import { useElonStore } from './elonStore'

export interface RecordData {
  id?: string
  labelId?: string
  date?: string
  startTime?: string
  endTime?: string
  remark?: string
}

const storeId = 'records'
export const useRecordStore = defineStore(storeId, () => {
  const elonStore = useElonStore<RecordData>(storeId, ['labelId', 'date', 'startTime', 'endTime'], ['remark'])

  const deleteRecord = async (id: string) => {
    elonStore.deleteEntity(elonStore.entityMap[id])
    await elonStore.commit()
  }

  const listBylabelId = (labelId: string) => elonStore.entities.value.filter((record) => record.labelId === labelId)

  const listByDate = async (date: string) => {
    const records = elonStore.entities.value.filter((record) => record.date === date)
    await elonStore.getDetails(records)
    return records
  }

  return {
    ...elonStore,
    deleteRecord,
    listBylabelId,
    listByDate,
  }
})
