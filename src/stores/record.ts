import { defineStore } from 'pinia'
import { useLabelStore } from '@/stores/label'
import { useUserStore } from '@/stores/user'
import { doc, setDoc, DocumentData, onSnapshot, DocumentReference, Unsubscribe, getDoc } from 'firebase/firestore'
import { customAsync } from '@/common/customPromise'

interface RecordData {
  labelId: string
  startTime: string
  endTime: string
  remark: string
}

export interface Record extends Partial<RecordData> {
  labelName?: string
  labelPicker?: string[]
  startTimeParts?: string[]
  endTimeParts?: string[]
  span?: number
}

const calculateLabelName = (record: Record) => {
  record.labelName = useLabelStore().labels.find((label) => label.id === record.labelId)!.name
}

const calculateSpan = (record: Record) => {
  const startTimeMinutes = Number(record.startTimeParts![0]) * 60 + Number(record.startTimeParts![1])
  const endTimeMinutes = Number(record.endTimeParts![0]) * 60 + Number(record.endTimeParts![1])
  record.span = endTimeMinutes - startTimeMinutes
}

const convertToRecord = (recordData: RecordData): Record => {
  const record = {
    ...recordData,
    labelPicker: [recordData.labelId],
    startTimeParts: recordData.startTime.split(':'),
    endTimeParts: recordData.endTime.split(':')
  }
  calculateLabelName(record)
  calculateSpan(record)
  return record
}

const addRecord = (records: Record[], newRecord: Record) => {
  let insertIndex = 0
  while (insertIndex < records.length) {
    const record = records[insertIndex]
    if (newRecord.startTime! >= record.endTime!) {
      break
    }
    insertIndex += 1
  }
  if (insertIndex !== 0 && newRecord.endTime! > records[insertIndex - 1].startTime!) {
    return false
  }
  records.splice(insertIndex, 0, newRecord)
  return true
}

const saveRecords = async (recordsDoc: DocumentReference, records: Record[]) => {
  await customAsync(() => {
    setDoc(recordsDoc, {
      records: records.map((record) => `${record.labelId},${record.startTime},${record.endTime},${record.remark}`).join('\n')
    })
  })
}

export const useRecordStore = defineStore('record', {
  state: () => {
    return {
      records: [] as Record[],
      recordsDoc: null as DocumentReference | null,
      recordSnapshot: null as Unsubscribe | null
    }
  },
  actions: {
    setByDoc(doc: DocumentData | undefined) {
      if (!doc) {
        this.records = []
        return
      }
      this.records = doc.records.split('\n').map((recordStr: string) => {
        const [labelId, startTime, endTime, remark] = recordStr.split(',')
        return convertToRecord({ labelId, startTime, endTime, remark })
      })
    },
    async getRecords(date: string) {
      if (this.recordSnapshot) {
        this.recordSnapshot()
      }
      date = date.replaceAll('/', '')
      this.recordsDoc = doc(useUserStore().recordsCollection!, date)
      debugger
      await customAsync(() => getDoc(this.recordsDoc!))
      debugger
      this.recordSnapshot = onSnapshot(this.recordsDoc, (newDoc) => {
        debugger
        this.setByDoc(newDoc.data())
      })
    },
    async addRecord(newRecord: Record, index = Infinity) {
      const newRecords = [...this.records]
      newRecords.splice(index, 1)
      if (!addRecord(newRecords, newRecord)) {
        return false
      }
      await saveRecords(this.recordsDoc!, newRecords)
      return true
    },
    async deleteRecord(index: number) {
      const newRecords = [...this.records]
      newRecords.splice(index, 1)
      await saveRecords(this.recordsDoc!, newRecords)
    }
  },
})