<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Icon as VanIcon,
  Cell as VanCell,
  ActionSheet as VanActionSheet,
  Dialog as VanDialog,
  Form as VanForm,
  Field as VanField,
  TextEllipsis as VanTextEllipsis,
  showConfirmDialog,
  showNotify
} from 'vant'
import { useLabelStore } from '@/stores/label'
import VanAction from '@/types/VanAction'

const labelStore = useLabelStore()
const labelForm = ref()
const editingName = ref('')
const showAction = ref(false)
const showEditor = ref(false)
const editingIndex = ref(-1)
const editingTitle = computed(() => editingIndex.value === -1 ? 'Add Lable' : 'Rename')

const actions: VanAction[] = [{
  name: 'rename',
  execute: () => {
    editingName.value = labelStore.labels[editingIndex.value].name
    showAction.value = false
    showLabelEditor()
  }
}, {
  name: 'delete',
  execute: async () => {
    if (labelStore.labels[editingIndex.value].recordNum) {
      showNotify('Please delete relevant records first')
      return
    }
    await showConfirmDialog({
      message: 'Data will not be recovered'
    })
    await labelStore.deleteLabel(editingIndex.value)
    showAction.value = false
  },
  color: '#ee0a24'
}]
const onActionSelect = (item: VanAction) => {
  item.execute()
}

const showLabelEditor = () => {
  labelForm.value?.resetValidation()
  showEditor.value = true 
}

const labelOnClick = (index: number) => {
  editingIndex.value = index
  showAction.value = true
}

const beforeClose = async (action: string) => {
  if (action !== 'confirm') {
    return true
  }

  try {
    await labelForm.value.validate()
    if (editingIndex.value === -1) {
      await labelStore.addLabel(editingName.value)
    } else {
      await labelStore.rename(editingIndex.value, editingName.value)
    }
    return true
  } catch {
    return false
  }
}

const addLable = () => {
  editingIndex.value = -1
  editingName.value = ''
  showLabelEditor()
}

const uniqueValidator = () => {
  const findIndex = labelStore.labels.findIndex((label) => label.name === editingName.value)
  return findIndex === -1 || findIndex === editingIndex.value
}
</script>

<template>
  <div class="label-list">
    <van-cell v-for="(label, index) in labelStore.labels" :key="label.id" is-link
      @click="labelOnClick(index)">
      <template #title>
        <van-text-ellipsis :content="label.name" />
      </template>
    </van-cell>
  </div>
  <van-action-sheet v-model:show="showAction" :actions="actions" @select="onActionSelect" />
  <van-icon name="add" color="#1989fa" size="3rem" class="add-label-icon" @click="addLable" />
  <van-dialog v-model:show="showEditor" :title="editingTitle" show-cancel-button :before-close="beforeClose">
    <van-form ref="labelForm">
      <van-field v-model="editingName" placeholder="label name" maxlength="50"
        :rules="[{ required: true, message: 'not empty' }, { validator: uniqueValidator, message: 'name repeat' }]" />
    </van-form>
  </van-dialog>
</template>

<style scoped>
.label-list {
  height: 100%;
  overflow-y: auto;
}

.add-label-icon {
  position: fixed;
  bottom: 70px;
  right: 20px;
}
</style>
