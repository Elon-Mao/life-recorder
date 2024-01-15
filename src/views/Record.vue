<script setup lang="ts">
import { ref, computed } from 'vue'
import {
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
import { useRecordStore, Record } from '@/stores/record'
import { useLabelStore } from '@/stores/label'
import VanAction from '@/types/VanAction'

const recordStore = useRecordStore()
const labelStore = useLabelStore()

const editingIndex = ref(Infinity)
const editingRecord = ref<Record>({})
const showPickerGroup = ref(false)

const actions: VanAction[] = [{
  name: 'End now',
  execute: () => {

  }
}, {
  name: 'Edit',
  execute: () => {
    editingRecord.value = {
      ...recordStore.records[editingIndex.value]
    }
    showAction.value = false
    showPickerGroup.value = true
  }
}, {
  name: 'Delete',
  execute: async () => {
    await showConfirmDialog({
      message: 'Data will not be recovered'
    })
    try {
      await recordStore.deleteRecord(editingIndex.value)
      showAction.value = false
    } catch { }
  },
  color: '#ee0a24'
}]
const onActionSelect = (item: VanAction) => {
  item.execute()
}

const showAction = ref(false)

const recordOnClick = (index: number) => {
  editingIndex.value = index
  showAction.value = true
}

const addRecord = () => {
  editingIndex.value = Infinity
  const newRecord: Record = {}
  newRecord.startTimeParts = newRecord.endTimeParts = getCurrentTimeParts()
  editingRecord.value = newRecord
  showPickerGroup.value = true
}

const addMode = ref('start now')

const isStartMode = () => {
  return editingIndex.value === Infinity && addMode.value === 'start now'
}

const pickerTabs = computed(() => {
  if (isStartMode()) {
    return ['label']
  }
  return ['label', 'start time', 'end time']
})

const getCurrentTimeParts = () => {
  const currentDate = new Date()
  return [currentDate.getHours() + '', currentDate.getMinutes() + '']
}

const onRecordConfirm = async () => {
  const newRecord = editingRecord.value
  if (isStartMode()) {
    newRecord.startTimeParts = newRecord.endTimeParts = getCurrentTimeParts()
  }
  newRecord.startTime = newRecord.startTimeParts!.join(':')
  newRecord.endTime = newRecord.endTimeParts!.join(':')
  if (newRecord.startTime > newRecord.endTime) {
    showNotify('End time cannot be earlier than start time')
    return
  }

  newRecord.labelId = newRecord.labelPicker![0]
  try {
    const result = await recordStore.addRecord(newRecord, editingIndex.value)
    if (result) {
      showPickerGroup.value = false
      showNotify({ type: 'success', message: 'add success' })
    } else {
      showNotify('time conflict')
    }
  } catch { }
}
</script>

<template>
  <div class="record-container">
    <van-cell class="van-contact-card" is-link center size="large" @click="addRecord">
      <template #title>
        <div class="add-record-wrapper">
          <van-button icon="plus" type="primary" size="small" />
          <span>Add Record</span>
        </div>
      </template>
    </van-cell>
    <van-cell v-for="(record, index) in recordStore.records" is-link center @click="recordOnClick(index)">
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
  <van-action-sheet v-model:show="showAction" :actions="actions" @select="onActionSelect" />
  <van-popup v-model:show="showPickerGroup" position="bottom" :close-on-click-overlay="false">
    <van-picker-group :tabs="pickerTabs" next-step-text="Next Step" @cancel="showPickerGroup = false"
      @confirm="onRecordConfirm">
      <template #title v-if="editingIndex === Infinity">
        <van-radio-group v-model="addMode" direction="horizontal" class="add-mode-wrapper">
          <van-radio name="start now">start now</van-radio>
          <van-radio name="import">import</van-radio>
        </van-radio-group>
      </template>
      <van-picker v-model="editingRecord.labelPicker" :visible-option-num="3" :columns="labelStore.labels"
        :columns-field-names="{ text: 'name', value: 'id' }" />
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
