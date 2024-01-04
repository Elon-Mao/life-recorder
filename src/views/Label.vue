<script setup lang="ts">
import { ref } from 'vue'
import {
  Icon as VanIcon,
  Cell as VanCell,
  ActionSheet as VanActionSheet,
  Dialog as VanDialog,
  Form as VanForm,
  Field as VanField
} from 'vant'
import { useLabelStore } from '@/stores/label'
import { computed } from 'vue'

interface LabelAction {
  name: string
  execute: () => void
}

const labelStore = useLabelStore()

const showLabelEditor = () => {
  labelForm.value?.resetValidation()
  showEditor.value = true 
}

const showAction = ref(false)
const showEditor = ref(false)
const labelForm = ref()
const actions: LabelAction[] = [{
  name: 'rename',
  execute: () => {
    editingName.value = labelStore.labels[editingIndex.value].name
    showLabelEditor()
  }
}, {
  name: 'delete',
  execute: () => {

  }
}]
const onSelect = (item: LabelAction) => {
  showAction.value = false
  item.execute()
}

const editingIndex = ref(-1)
const editingTitle = computed(() => editingIndex.value === -1 ? 'Add Lable' : 'Rename')

const labelOnClick = (index: number) => {
  editingIndex.value = index
  showAction.value = true
}

const editingName = ref('')

const beforeClose = (action: string): Promise<boolean> => {
  if (action !== 'confirm') {
    return Promise.resolve(true)
  }

  return new Promise((resolve) => {
    labelForm.value.validate().then(() => {
      if (editingIndex.value === -1) {
        labelStore.addLabel(editingName.value)
      } else {
        labelStore.rename(editingIndex.value, editingName.value)
      }
      resolve(true)
    }).catch(() => {
      resolve(false)
    })
  })
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
  <van-cell v-for="(label, index) in labelStore.labels" :key="label.id" is-link :title="label.name" @click="labelOnClick(index)" />
  <van-action-sheet v-model:show="showAction" :actions="actions" @select="onSelect" />
  <van-icon name="add" color="#1989fa" size="3rem" class="add-label-icon" @click="addLable" />
  <van-dialog v-model:show="showEditor" :title="editingTitle" show-cancel-button :before-close="beforeClose">
    <van-form ref="labelForm">
      <van-field v-model="editingName" name="label" placeholder="label name"
          :rules="[{ required: true, message: 'not empty' }, { validator: uniqueValidator, message: 'name repeat' }]" />
    </van-form>
  </van-dialog>
</template>

<style scoped>
.add-label-icon {
  position: fixed;
  bottom: 70px;
  right: 20px;
}
</style>
