import { useLabelStore } from '@/stores/label'
import type { RecordData } from '@/stores/recordData'
import RecordForm from '@/types/RecordForm'

const labelStore = useLabelStore()

const calculateLabelName = (record: RecordForm) => {
  record.labelName = labelStore.labels.find((label) => label.id === record.labelId)!.labelName
}

export const calculateSpan = (record: RecordForm) => {
  const startTimeMinutes = Number(record.startTimeParts![0]) * 60 + Number(record.startTimeParts![1])
  const endTimeMinutes = Number(record.endTimeParts![0]) * 60 + Number(record.endTimeParts![1])
  record.span = endTimeMinutes - startTimeMinutes
}

export default (recordData: RecordData): RecordForm => {
  const record = {
    ...recordData,
    labelPicker: [recordData.labelId],
    startTimeParts: recordData.startTime!.split(':'),
    endTimeParts: recordData.endTime!.split(':')
  } as RecordForm
  calculateLabelName(record)
  calculateSpan(record)
  return record
}