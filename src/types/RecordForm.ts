import type { RecordData } from '@/stores/recordData'

export default interface RecordForm extends RecordData {
  labelName?: string
  labelPicker: string[]
  startTimeParts: string[]
  endTimeParts: string[]
  span?: number
}