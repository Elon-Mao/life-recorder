import RecordData from './RecordData'

export default interface RecordForm extends Partial<RecordData> {
  labelName?: string
  labelPicker: string[]
  startTimeParts: string[]
  endTimeParts: string[]
  span?: number
}