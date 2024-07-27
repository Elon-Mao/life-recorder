<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NavBar as VanNavBar,
  Icon as VanIcon,
  Popover as VanPopover,
  Cell as VanCell,
  Popup as VanPopup,
  Uploader as VanUploader,
  Button as VanButton,
  showConfirmDialog,
  UploaderFileListItem,
  showNotify,
} from 'vant'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useLabelStore } from '@/stores/label'
import { useRecordStore } from '@/stores/recordData'
import { useSystemStore } from '@/stores/system'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth, provider } from '@/config/firebase'
import downloadText from '@/common/downloadText'
import type { Label } from '@/stores/label'
import type { RecordData } from '@/stores/recordData'

const userPopShow = ref(false)
const importPopShow = ref(false)
const fileList = ref<UploaderFileListItem []>([])
const route = useRoute()
const userStore = useUserStore()
const labelStore = useLabelStore()
const recordStore = useRecordStore()
const systemStore = useSystemStore()
onAuthStateChanged(auth, (user) => {
  userPopShow.value = false
  userStore.setUser(user)
})

const exportUserData = async () => {
  const records = [...recordStore.entities]
  records.sort((record0, record1) => {
    if (record0.date! > record1.date!) {
      return -1
    }
    if (record0.date! < record1.date!) {
      return 1
    }
    return record0.startTime! > record1.startTime! ? -1 : 1
  })

  downloadText('Record Id,Label Id,Date,Start Time,End Time,\n' + records.map((record) =>
    `${record.id},${record.labelId},${record.date},${record.startTime},${record.endTime}`)
    .join(',\n'), 'records.csv')
  downloadText('Label Id,Name,Record Number,\n' + labelStore.labels.map((label) =>
    `${label.id},${label.labelName},${records.reduce((recordNum, record) => record.labelId === label.id ? recordNum + 1 : recordNum
      , 0)}`).join(',\n'), 'labels.csv')
}

const showImportPop = () => {
  userPopShow.value = false
  importPopShow.value = true
}

const confirmSignOut = async () => {
  await showConfirmDialog({
    title: 'Sign out?',
    closeOnClickOverlay: true
  })
  signOut(auth)
}

const importDisabled = computed(() => {
  if (fileList.value.length !== 2) {
    return true
  }
  const fileName0 = fileList.value[0].file!.name
  const fileName1 = fileList.value[1].file!.name
  return !(fileName0 === 'labels.csv' && fileName1 === 'records.csv' || fileName0 === 'records.csv' && fileName1 === 'labels.csv')
})

const readRecords = (recordsFile: File) => {
  const recordsReader = new FileReader()
  recordsReader.onload = async (event: ProgressEvent<FileReader>) => {
    const csv = event.target!.result as String
    const rows = csv.split('\n')
    const records: RecordData[] = []
    rows.shift()
    rows.forEach(async row => {
      const columns = row.split(',')
      records.push({
        id: columns[0],
        labelId: columns[1],
        date: columns[2],
        startTime: columns[3],
        endTime: columns[4],
      })
    })
    recordStore.setEntities(records)
    await recordStore.commit()
    systemStore.setLoading(false)
    showNotify({ type: 'success', message: 'Import Success' })
    importPopShow.value = false
  }
  recordsReader.readAsText(recordsFile)
}

const readLabels = (labelsFile: File, recordsFile: File) => {
  systemStore.setLoading(true)
  const labelsReader = new FileReader()
  labelsReader.onload = async (event: ProgressEvent<FileReader>) => {
    const csv = event.target!.result as String
    const rows = csv.split('\n')
    const labels: Label[] = []
    rows.shift()
    rows.forEach(async row => {
      const columns = row.split(',')
      labels.push({
        id: columns[0],
        labelName: columns[1],
        recordNum: Number(columns[2])
      })
    })
    labelStore.setEntities(labels)
    await labelStore.commit()
    readRecords(recordsFile)
  }
  labelsReader.readAsText(labelsFile)
}

const confirmImport = async () => {
  await showConfirmDialog({
    title: 'All data will be covered.'
  })
  const file0 = fileList.value[0].file!
  const file1 = fileList.value[1].file!
  const [labelsFile, recordsFile] = file0.name === 'labels.csv' ? [file0, file1] : [file1, file0]
  readLabels(labelsFile, recordsFile)
}
</script>

<template>
  <van-nav-bar :title="route.meta.title" :fixed="true">
    <template #right>
      <van-popover v-model:show="userPopShow" placement="bottom-end">
        <div class="user-pop">
          <template v-if="userStore.user">
            <van-cell :title="userStore.user.displayName" icon="user" size="large" class="user-name" />
            <van-cell title="Export User Data" icon="down" @click="exportUserData" />
            <van-cell title="Import User Data" icon="upgrade" @click="showImportPop"/>
            <van-cell title="Sign Out" icon="exchange" @click="confirmSignOut" />
          </template>
          <van-cell v-else title="Sign In With Google" icon="home-o" @click="signInWithPopup(auth, provider)" />
        </div>
        <template #reference>
          <div v-if="userStore.user" class="user-avatar">{{ (userStore.user.displayName || '?')[0] }}</div>
          <van-icon v-else name="user-circle-o" size="2rem" />
        </template>
      </van-popover>
    </template>
  </van-nav-bar>
  <van-popup v-model:show="importPopShow" :closeable="true" :close-on-click-overlay="false">
    <div class="import-pop">
      <van-uploader v-model="fileList" multiple :max-count="2" accept=".csv" upload-icon="plus" />
      <van-button icon="upgrade" type="primary" :disabled="importDisabled" @click="confirmImport">Import</van-button>
    </div>
  </van-popup>
</template>

<style scoped>
.user-pop {
  display: flex;
  flex-direction: column;
}

.user-name {
  background-color: var(--van-gray-3);
}

.user-avatar {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background-color: rgb(114, 50, 221);
  font-size: 1rem;
  line-height: 1.5rem;
  color: white;
}

.import-pop {
  width: 50dvw;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.import-pop>div {
  margin-top: 3rem;
}
</style>