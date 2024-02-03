<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NavBar as VanNavBar,
  Calendar as VanCalendar,
  Cell as VanCell,
  Button as VanButton,
  TextEllipsis as VanTextEllipsis,
  Popup as VanPopup,
  PickerGroup as VanPickerGroup,
  Picker as VanPicker,
  TimePicker as VanTimePicker,
  Field as VanField,
  RadioGroup as VanRadioGroup,
  Radio as VanRadio,
  ActionSheet as VanActionSheet,
  showNotify,
  showConfirmDialog
} from 'vant'
import {
  collection,
  doc,
  query,
  setDoc,
  deleteDoc,
  onSnapshot,
  where,
  Unsubscribe
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import customPromise from '@/common/customPromise'
import { useUserStore } from '@/stores/user'
import { useLabelStore } from '@/stores/label'
import VanAction from '@/types/VanAction'
import RecordData from '@/types/RecordData'

interface RecordForm extends Partial<RecordData> {
  labelName?: string
  labelPicker: string[]
  startTimeParts: string[]
  endTimeParts: string[]
  span?: number
}

const userStore = useUserStore()
const labelStore = useLabelStore()
const recordCollection = collection(db, `users/${userStore.user.uid}/records`)

const getCurrentTimeParts = () => {
  const currentDate = new Date()
  return [currentDate.getHours() + '', currentDate.getMinutes() + '']
}

const getInitRecord = () => {
  const currentTimeParts = getCurrentTimeParts()
  return {
    labelPicker: [],
    startTimeParts: [...currentTimeParts],
    endTimeParts: [...currentTimeParts],
    remark: ''
  }
}

const editingRecord = ref<RecordForm>(getInitRecord())
const showPickerGroup = ref(false)
const activeTab = ref(0)
const showAction = ref(false)
const showCalendar = ref(false)
const addMode = ref('start now')

const openPickerGroup = () => {
  activeTab.value = 0
  showPickerGroup.value = true
}

const actions: VanAction[] = [{
  name: 'End now',
  execute: async () => {
    editingRecord.value.endTimeParts = getCurrentTimeParts()
    await onRecordConfirm()
    showAction.value = false
  }
}, {
  name: 'Edit',
  execute: () => {
    showAction.value = false
    openPickerGroup()
  }
}, {
  name: 'Delete',
  execute: async () => {
    await showConfirmDialog({
      message: 'Data will not be recovered'
    })
    await customPromise(Promise.all([
      deleteDoc(doc(recordCollection, editingRecord.value.id)),
      labelStore.setRecordNum(editingRecord.value.labelId!, -1)
    ]))
    showAction.value = false
  },
  color: '#ee0a24'
}]
const onActionSelect = (item: VanAction) => {
  item.execute()
}

const recordOnClick = (recordData: RecordForm) => {
  addMode.value = 'import'
  editingRecord.value = {
    ...recordData
  }
  showAction.value = true
}

const addRecord = () => {
  addMode.value = 'start now'
  editingRecord.value = getInitRecord()
  openPickerGroup()
}

const isStartMode = () => {
  return editingRecord === null && addMode.value === 'start now'
}

const pickerTabs = computed(() => {
  if (isStartMode()) {
    return ['label']
  }
  return ['label', 'start time', 'end time']
})

const isTimeConflict = (newRecord: RecordForm) => {
  let laterRecord = null
  for (const record of records.value) {
    if (record.id === editingRecord.value.id) {
      continue
    }
    if (newRecord.startTime! >= record.endTime!) {
      break
    }
    laterRecord = record
  }
  return laterRecord && newRecord.endTime! > laterRecord.startTime!
}

const onRecordConfirm = async () => {
  const newRecord = editingRecord.value
  if (isStartMode()) {
    newRecord.startTimeParts = newRecord.endTimeParts = getCurrentTimeParts()
  }
  newRecord.startTime = newRecord.startTimeParts.join(':')
  newRecord.endTime = newRecord.endTimeParts.join(':')
  if (newRecord.startTime > newRecord.endTime) {
    showNotify('End time cannot be earlier than start time')
    return
  }
  if (isTimeConflict(newRecord)) {
    showNotify('time conflict')
    return
  }
  const data = {
    labelId: newRecord.labelPicker[0],
    date: recordsDateStr.value,
    startTime: newRecord.startTime,
    endTime: newRecord.endTime,
    remark: newRecord.remark
  }
  if (newRecord.id) {
    await customPromise(setDoc(doc(recordCollection, newRecord.id), data))
  } else {
    const newDoc = doc(recordCollection)
    await customPromise(Promise.all([
      setDoc(doc(recordCollection, newDoc.id), data),
      labelStore.setRecordNum(data.labelId, 1)
    ]))
  }
  
  showPickerGroup.value = false
  showNotify({ type: 'success', message: 'add success' })
}

const addRecordDate = (addNum: number) => {
  const newDate = new Date(recordsDate)
  newDate.setDate(newDate.getDate() + addNum)
  recordsDate = newDate
  onDateChange()
}
const lastDay = () => {
  addRecordDate(-1)
}
const nextDay = () => {
  addRecordDate(1)
}
const onDateConfirm = (value: Date) => {
  recordsDate = value
  onDateChange()
  showCalendar.value = false
}

const calculateLabelName = (record: RecordForm) => {
  record.labelName = useLabelStore().labels.find((label) => label.id === record.labelId)!.labelName
}

const calculateSpan = (record: RecordForm) => {
  const startTimeMinutes = Number(record.startTimeParts![0]) * 60 + Number(record.startTimeParts![1])
  const endTimeMinutes = Number(record.endTimeParts![0]) * 60 + Number(record.endTimeParts![1])
  record.span = endTimeMinutes - startTimeMinutes
}

const convertToRecord = (recordData: RecordData): RecordForm => {
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

let recordsDate = new Date()
const recordsDateStr = ref('')
const records = ref<RecordForm[]>([])
let unsubscribe: Unsubscribe
const onDateChange = () => {
  const newDateStr = `${recordsDate.getFullYear()}/${String(recordsDate.getMonth() + 1).padStart(2, '0')}/${String(recordsDate.getDate()).padStart(2, '0')}`
  if (newDateStr === recordsDateStr.value) {
    return
  }
  recordsDateStr.value = newDateStr
  if (unsubscribe) {
    unsubscribe()
  }
  unsubscribe = onSnapshot(query(recordCollection, where('date', '==', recordsDateStr.value)), (querySnapshot) => {
    records.value = []
    querySnapshot.forEach((doc) => {
      records.value.push(convertToRecord({
        id: doc.id,
        ...doc.data()
      } as RecordData))
    })
    records.value.sort((record0, record1) => record0.startTime! > record1.startTime! ? -1 : 1)
  })
}
onDateChange()
</script>

<template>
  <div class="record-container">
    <van-nav-bar left-text="Last Day" right-text="Next Day" @click-left="lastDay" @click-right="nextDay">
      <template #title>
        <van-button icon="calendar-o" @click="showCalendar = true">
          {{ recordsDateStr }}
        </van-button>
      </template>
    </van-nav-bar>
    <van-cell class="van-contact-card" is-link center size="large" @click="addRecord">
      <template #title>
        <div class="add-record-wrapper">
          <van-button icon="plus" type="primary" size="small" />
          <span>Add Record</span>
        </div>
      </template>
    </van-cell>
    <van-cell v-for="record in records" :key="record.id" is-link center @click="recordOnClick(record)">
      <template #title>
        <van-text-ellipsis :content="record.labelName" />
      </template>
      <template #label>
        <div class="span-info">
          <span>{{ `${record.startTime}~${record.endTime}` }}</span>
          <span>{{ `${record.span}minutes` }}</span>
        </div>
        <span>{{ record.remark }}</span>
      </template>
    </van-cell>
  </div>
  <van-calendar v-model:show="showCalendar" :round="false" position="top" :min-date="new Date('2023/01/01')"
    @confirm="onDateConfirm" />
  <van-action-sheet v-model:show="showAction" :actions="actions" @select="onActionSelect" />
  <van-popup v-model:show="showPickerGroup" position="bottom" :close-on-click-overlay="false">
    <van-picker-group :tabs="pickerTabs" v-model:active-tab="activeTab" @cancel="showPickerGroup = false"
      @confirm="onRecordConfirm">
      <template #title v-if="!editingRecord.id">
        <van-radio-group v-model="addMode" direction="horizontal" class="add-mode-wrapper">
          <van-radio name="start now">start now</van-radio>
          <van-radio name="import">import</van-radio>
        </van-radio-group>
      </template>
      <van-picker v-model="editingRecord.labelPicker" :visible-option-num="3" :columns="labelStore.labels"
        :columns-field-names="{ text: 'labelName', value: 'id' }" />
      <van-time-picker v-model="editingRecord.startTimeParts" :visible-option-num="3" />
      <van-time-picker v-model="editingRecord.endTimeParts" :visible-option-num="3" />
    </van-picker-group>
    <van-field v-model="editingRecord.remark" label-align="top" label="Remark:" placeholder="input remark" maxlength="50"
      type="textarea" show-word-limit />
  </van-popup>
</template>

<style scoped>
.record-container {
  height: 100%;
  overflow-y: auto;
}

.add-record-wrapper {
  display: flex;
  align-items: center;
}

.add-record-wrapper>span {
  margin-left: 0.5rem;
}

.span-info {
  width: 8.3rem;
  display: flex;
  justify-content: space-between;
}

.add-mode-wrapper {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  flex-wrap: nowrap;
  text-wrap: nowrap;
}
</style>
