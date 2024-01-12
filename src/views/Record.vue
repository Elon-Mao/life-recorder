<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  Cell as VanCell,
  Button as VanButton,
  Divider as VanDivider,
  TextEllipsis as VanTextEllipsis,
  Popup as VanPopup,
  PickerGroup as VanPickerGroup,
  Picker as VanPicker,
  TimePicker as VanTimePicker,
  Field as VanField,
  RadioGroup as VanRadioGroup,
  Radio as VanRadio,
  Overlay as VanOverlay,
  Loading as VanLoading,
  showNotify
} from 'vant'
import { useRecordStore, Record } from '@/stores/record'
import { useLabelStore } from '@/stores/label'
import VanAction from '@/types/VanAction'

const recordStore = useRecordStore()
const labelStore = useLabelStore()

const editingIndex = ref(0)
const editingRecord = ref<{
  [key in keyof Record]?: Record[key]
}>({})
const minTime = ref('')
const maxTime = ref('')
const showPickerGroup = ref(false)

const actions: VanAction[] = [{
  name: 'edit',
  execute: () => {

  }
}, {
  name: 'delete',
  execute: () => {

  }
}]

const currentActions: VanAction[] = [{
  name: 'end now',
  execute: () => {

  }
}, ...actions]

const showAction = ref(false)

const recordOnClick = (index: number) => {
  editingIndex.value = index
  editingRecord.value = {}
  // editingTime.value = recordStore.records[index].startTime.split(':')
  // minTime.value = index < recordStore.records.length - 1 ? recordStore.records[index + 1].endTime! : '00:00'
  // maxTime.value = index > 0 ? recordStore.records[index - 1].startTime! : '23:59'
  // showTimePicker.value = true
  showAction.value = true
}

const addRecord = () => {
  showPickerGroup.value = true
}

const addMode = ref('start now')

const pickerTabs = computed(() => addMode.value === 'start now' ? ['label'] : ['label', 'start time', 'end time'])

const recordRemark = ref('')

const getCurrentTimeParts = () => {
  const currentDate = new Date()
  return [currentDate.getHours() + '', currentDate.getMinutes() + '']
}

const addConfirm = async (selectGroups: any[]) => {
  const [startTimeParts, endTimeParts] = selectGroups.length === 3 ?
    [selectGroups[1].selectedValues, selectGroups[2].selectedValues] : (() => {
      const result = getCurrentTimeParts()
      return [result, result]
    })()
  const newRecord = {
    labelId: selectGroups[0].selectedValues[0],
    startTime: startTimeParts.join(':'),
    endTime: endTimeParts.join(':'),
    startTimeParts,
    endTimeParts,
  }
  if (newRecord.startTime > newRecord.endTime) {
    showNotify('End time cannot be earlier than start time')
    return
  }
  showLoading.value = true
  try {
    const result = await recordStore.addRecord(newRecord)
    if (result) {
      showPickerGroup.value = false
      showNotify({ type: 'success', message: 'add success' })
    } else {
      showNotify('time conflict')
    }
  } catch(e) {

  }
  showLoading.value = false
}

const showLoading = ref(false)
</script>

<template>
  <div class="record-container">
    <van-cell class="van-contact-card" is-link center @click="addRecord">
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
        <span>{{ `${record.startTime}~${record.endTime} ${record.span}minutes` }}</span>
      </template>
    </van-cell>
  </div>
  <van-action-sheet v-model:show="showAction" :actions="actions" @select="onSelect" />
  <!-- <div class="record-container">
    <div class="record-border">label</div>
    <div class="record-border">start time</div>
    <div class="record-border">end time</div>
    <div class="record-cell">minutes</div>
    <template v-for="record in recordStore.records">
      <div class="record-cell">Study English</div>
      <div class="record-cell">
        <van-field v-model="record.startTime" readonly placeholder="select time" @click="editStartTime" />
      </div>
      <div class="record-cell">Content 3</div>
      <div class="record-cell">Content 3</div>
    </template>
  </div> -->
  <van-popup v-model:show="showPickerGroup" position="bottom" :close-on-click-overlay="false">
    <van-picker-group :tabs="pickerTabs" next-step-text="Next Step" @cancel="showPickerGroup = false"
      @confirm="addConfirm">
      <template #title>
        <van-radio-group v-model="addMode" direction="horizontal" class="add-mode-wrapper">
          <van-radio name="start now">start now</van-radio>
          <van-radio name="import">import</van-radio>
        </van-radio-group>
      </template>
      <van-picker :visible-option-num="3" :columns="labelStore.labels"
        :columns-field-names="{ text: 'name', value: 'id' }" />
      <van-time-picker :visible-option-num="3" />
      <van-time-picker :visible-option-num="3" />
    </van-picker-group>
    <van-field v-model="recordRemark" placeholder="Input Remark" class="record-remark" />
  </van-popup>
  <van-overlay :show="showLoading">
    <van-loading type="spinner" />
  </van-overlay>
</template>

<style scoped>
.record-container {
  height: 100%;
  overflow-y: auto;
}

/* .add-record-cell::after {
  background: repeating-linear-gradient(315deg, var(--van-warning-color)0, var(--van-warning-color)20%, transparent 0, transparent 25%, var(--van-primary-color)0, var(--van-primary-color)45%, transparent 0, transparent 50%);
  background-size: 80px;
  content: "";
  border-bottom: 1px solid var(--van-cell-border-color);
} */

.add-record-wrapper {
  display: flex;
  align-items: center;
}

.add-record-wrapper>span {
  margin-left: 0.5rem;
}

/* .record-container {
  display: grid;
  justify-items: center;
  align-items: center;
  grid-template-columns: 1fr auto auto auto;
  grid-template-rows: repeat(auto-fill, minmax(50px, 1fr));
  gap: 1px;
} */

/* .record-container>div {
  background-color: lightblue;
} */

.add-mode-wrapper {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  flex-wrap: nowrap;
  text-wrap: nowrap;
}

.record-remark {
  margin: 1rem 0;
}
</style>
