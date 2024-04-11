<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NavBar as VanNavBar,
  Calendar as VanCalendar,
  Cell as VanCell,
  Button as VanButton,
  Popup as VanPopup,
  PickerGroup as VanPickerGroup,
  Picker as VanPicker,
  TimePicker as VanTimePicker,
  Field as VanField,
  RadioGroup as VanRadioGroup,
  Radio as VanRadio,
  ActionSheet as VanActionSheet,
  showNotify,
  showConfirmDialog,
  Icon as vanIcon,
} from 'vant'
import customPromise from '@/common/customPromise'
import convertToRecord from '@/common/convertToRecord'
import { useLabelStore } from '@/stores/label'
import { useRecordStore } from '@/stores/recordData'
import VanAction from '@/types/VanAction'
import RecordForm from '@/types/RecordForm'
import { getFormatDate } from '@/common/dateTools'
import type { RecordData } from '@/stores/recordData'

const labelStore = useLabelStore()
const recordStore = useRecordStore()

const getCurrentTimeParts = () => {
  const currentDate = new Date()
  return [currentDate.getHours() + '', currentDate.getMinutes() + '']
}

const getInitRecord = () => {
  const currentTimeParts = getCurrentTimeParts()
  return {
    labelPicker: [labelStore.labels[0].id!],
    startTimeParts: [...currentTimeParts],
    endTimeParts: [...currentTimeParts],
    remark: ''
  }
}

const editingRecord = ref<RecordForm>({
  labelPicker: [],
  startTimeParts: [],
  endTimeParts: []
})
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
      recordStore.deleteRecord(editingRecord.value.id!),
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
  if (!labelStore.labels.length) {
    showNotify('Please add label first')
    return
  }
  addMode.value = 'start now'
  editingRecord.value = getInitRecord()
  openPickerGroup()
}

const isStartMode = () => {
  return !editingRecord.value.id && addMode.value === 'start now'
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

const timePartsToStr = (timeParts: string[]) => {
  return timeParts.map((timePart) => timePart.padStart(2, '0')).join(':')
}

const onRecordConfirm = async () => {
  const newRecord = editingRecord.value
  if (isStartMode()) {
    newRecord.startTimeParts = newRecord.endTimeParts = getCurrentTimeParts()
  }
  newRecord.startTime = timePartsToStr(newRecord.startTimeParts)
  newRecord.endTime = timePartsToStr(newRecord.endTimeParts)
  if (newRecord.startTime > newRecord.endTime) {
    showNotify('End time cannot be earlier than start time')
    return
  }
  if (isTimeConflict(newRecord)) {
    showNotify('Time Conflict')
    return
  }
  const data = {
    id: newRecord.id,
    labelId: newRecord.labelPicker[0],
    date: recordsDateStr.value,
    startTime: newRecord.startTime,
    endTime: newRecord.endTime,
    remark: newRecord.remark
  }
  if (data.id) {
    const promiseAll = [recordStore.setEntity(data)]
    const oldLabelId = records.value.find((record) => record.id === data.id)!.labelId!
    if (oldLabelId !== data.labelId) {
      promiseAll.push(labelStore.setRecordNum(oldLabelId, -1))
      promiseAll.push(labelStore.setRecordNum(data.labelId, 1))
    }
    await customPromise(Promise.all(promiseAll))
  } else {
    await customPromise(Promise.all([
      recordStore.addEntity(data),
      labelStore.setRecordNum(data.labelId, 1)
    ]))
  }

  await getRecordsByDate()
  showPickerGroup.value = false
  showNotify({ type: 'success', message: 'Add Success' })
}

const addRecordDate = (addNum: number) => {
  const newDate = new Date(recordsDate.value)
  newDate.setDate(newDate.getDate() + addNum)
  recordsDate.value = newDate
  onDateChange()
}
const lastDay = () => {
  addRecordDate(-1)
}
const nextDay = () => {
  addRecordDate(1)
}
const onDateConfirm = async (value: Date) => {
  recordsDate.value = value
  await onDateChange()
  showCalendar.value = false
}

let recordsDate = ref(new Date())
const recordsDateStr = ref('')
const records = ref<RecordForm[]>([])

const getRecordsByDate = async () => {
  records.value = []
  const recordDatas = await customPromise<RecordData[]>(recordStore.listByDate(recordsDateStr.value))
  records.value = recordDatas
    .map(convertToRecord)
    .sort((record0, record1) => record0.startTime! > record1.startTime! ? -1 : 1)
}

const onDateChange = async () => {
  const newDateStr = getFormatDate(recordsDate.value)
  if (newDateStr === recordsDateStr.value) {
    return
  }
  recordsDateStr.value = newDateStr
  await getRecordsByDate()
}

if (labelStore.labels.length) {
  onDateChange()
} else {
  const labelsWatch = watch(() => labelStore.labels, () => {
    if (labelStore.labels.length) {
      onDateChange()
      labelsWatch()
    }
  })
}
</script>

<template>
  <div class="record-container">
    <van-nav-bar @click-left="lastDay" @click-right="nextDay">
      <template #title>
        <van-button icon="calendar-o" @click="showCalendar = true">
          {{ recordsDateStr }}
        </van-button>
      </template>
      <template #left>
        <van-icon name="arrow-left" />
        <span class="van-nav-bar__text">Last Day</span>
      </template>
      <template #right>
        <span class="van-nav-bar__text">Next Day</span>
        <van-icon name="arrow" />
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
    <van-cell v-for="record in records" :key="record.id" is-link center @click="recordOnClick(record)"
      :title="record.labelName" title-class="text-ellipsis">
      <template #label>
        <div class="span-info">
          <span>{{ `${record.startTime}~${record.endTime}` }}</span>
          <span>{{ `${record.span} minutes` }}</span>
        </div>
        <span>{{ record.remark }}</span>
      </template>
    </van-cell>
  </div>
  <van-calendar v-model:show="showCalendar" :round="false" position="top" :min-date="new Date('2023/01/01')"
    @confirm="onDateConfirm" :default-date="recordsDate" />
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
    <van-field v-model="editingRecord.remark" label-align="top" label="Remark:" placeholder="input remark"
      maxlength="50" type="textarea" show-word-limit />
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
  width: 9rem;
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