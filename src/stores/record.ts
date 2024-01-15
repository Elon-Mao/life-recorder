import { defineStore } from 'pinia'
import { useLabelStore } from '@/stores/label'

const labelStore = useLabelStore()

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
  record.labelName = labelStore.labels.find((label) => label.id === record.labelId)!.name
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

export const useRecordStore = defineStore('record', {
  state: () => {
    // return {
    //   records: [{
    //     labelId: '1',
    //     startTime: '18:04',
    //     endTime: '20:05',
    //     remark: ''
    //   }, {
    //     labelId: '1',
    //     startTime: '18:03',
    //     endTime: '18:04',
    //     remark: ''
    //   }, {
    //     labelId: '1',
    //     startTime: '18:02',
    //     endTime: '18:03',
    //     remark: ''
    //   }, {
    //     labelId: '1',
    //     startTime: '18:01',
    //     endTime: '18:02',
    //     remark: ''
    //   }, {
    //     labelId: '1',
    //     startTime: '18:00',
    //     endTime: '18:01',
    //     remark: ''
    //   }, {
    //     labelId: '3',
    //     startTime: '11:00',
    //     endTime: '11:30',
    //     remark: ''
    //   }, {
    //     labelId: '2',
    //     startTime: '10:00',
    //     endTime: '10:45',
    //     remark: ''
    //   }, {
    //     labelId: '1',
    //     startTime: '09:30',
    //     endTime: '10:00',
    //     remark: ''
    //   }, {
    //     labelId: '1',
    //     startTime: '09:00',
    //     endTime: '09:30',
    //     remark: ''
    //   }].map(convertToRecord)
    // }
    return {
      records: [] as Record[]
    }
  },
  actions: {
    async addRecord(newRecord: Record, index = Infinity) {
      const newRecords = [...this.records]
      newRecords.splice(index, 1)
      if (!addRecord(newRecords, newRecord)) {
        return false
      }
      // fetch()
      calculateLabelName(newRecord)
      calculateSpan(newRecord)
      this.records = newRecords
      return true
    },
    async deleteRecord(index: number) {
      const newRecords = [...this.records]
      newRecords.splice(index, 1)
      // fetch()
      this.records = newRecords
    }
  },
})