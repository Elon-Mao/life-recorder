<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Icon as VanIcon,
  Cell as VanCell,
  ActionSheet as VanActionSheet,
  Dialog as VanDialog,
  Form as VanForm,
  Field as VanField,
  showConfirmDialog,
  showNotify,
} from 'vant'
import { Label, useLabelStore } from '@/stores/label'
import VanAction from '@/types/VanAction'
import customPromise from '@/common/customPromise'

const router = useRouter()
const labelStore = useLabelStore()
const labelForm = ref()
const initLabel = {
  labelName: '',
  recordNum: 0
}
const editingLabel = ref<Label>({
  ...initLabel
})
const showAction = ref(false)
const showEditor = ref(false)
const editingTitle = computed(() => editingLabel.value.id ? 'Rename' : 'Add Lable')

const actions = computed<VanAction[]>(() => [{
  name: 'rename',
  execute: () => {
    showAction.value = false
    showLabelEditor()
  }
}, {
  name: 'analyse',
  execute: async () => {
    await router.push({
      path: '/home/analysis', query: {
        labelId: editingLabel.value.id
      }
    })
    showAction.value = false
  }
}, {
  name: 'delete',
  execute: async () => {
    if (editingLabel.value.recordNum! > 0) {
      showNotify('Please delete relevant records first')
      return
    }
    await showConfirmDialog({
      message: 'Data will not be able to recover'
    })
    await customPromise(labelStore.deleteLabel(editingLabel.value.id!))
    showAction.value = false
  },
  color: '#ee0a24',
}])
const onActionSelect = (item: VanAction) => {
  item.execute()
}

const showLabelEditor = () => {
  labelForm.value?.resetValidation()
  showEditor.value = true
}

const labelOnClick = (label: Label) => {
  editingLabel.value = {
    ...label
  }
  showAction.value = true
}

const beforeClose = async (action: string) => {
  if (action !== 'confirm') {
    return true
  }

  try {
    await labelForm.value.validate()
    await customPromise(labelStore.setLabel(editingLabel.value))
    return true
  } catch {
    return false
  }
}

const addLable = () => {
  editingLabel.value = {
    ...initLabel
  }
  showLabelEditor()
}

const uniqueValidator = () => {
  const findLabel = labelStore.labels.find((label) => label.labelName === editingLabel.value.labelName)
  return !findLabel || findLabel.id === editingLabel.value.id
}
</script>

<template>
  <div class="label-list">
    <van-cell v-for="label in labelStore.labels" :key="label.id" is-link :label="`Record number: ${label.recordNum}`"
      @click="labelOnClick(label)" :title="label.labelName" title-class="text-ellipsis" />
  </div>
  <van-action-sheet v-model:show="showAction" :actions="actions" @select="onActionSelect" />
  <van-icon name="add" color="#1989fa" size="3rem" class="add-label-icon" @click="addLable" />
  <van-dialog v-model:show="showEditor" :title="editingTitle" show-cancel-button :before-close="beforeClose">
    <van-form ref="labelForm">
      <van-field v-model="editingLabel.labelName" placeholder="label name" maxlength="50"
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
