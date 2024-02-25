<script setup lang="ts">
import { ref } from 'vue'
import {
  NavBar as VanNavBar,
  Icon as VanIcon,
  Popover as VanPopover,
  Cell as VanCell,
} from 'vant'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useLabelStore } from '@/stores/label'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth, provider, db } from '@/config/firebase'
import {
  collection,
  query,
  getDocs,
} from 'firebase/firestore'
import downloadText from '@/common/downloadText'
import RecordData from '@/types/RecordData'

const showUserPop = ref(false)
const route = useRoute()
const userStore = useUserStore()
const labelStore = useLabelStore()
onAuthStateChanged(auth, (user) => {
  showUserPop.value = false
  userStore.setUser(user)
})

const exportUserData = async () => {
  const querySnapshot = await getDocs(query(collection(db, `users/${useUserStore().user.uid}/records`)))
  const records: RecordData[] = []
  querySnapshot.forEach((doc) => {
    records.push({
      id: doc.id,
      ...doc.data()
    } as RecordData)
  })
  records.sort((record0, record1) => {
    if (record0.date > record1.date) {
      return -1
    }
    if (record0.date < record1.date) {
      return 1
    }
    return record0.startTime! > record1.startTime! ? -1 : 1
  })

  downloadText('Record Id,Label Id,Date,Start Time,End Time,Remark,\n' + records.map((record) =>
    `${record.id},${record.labelId},${record.date},${record.startTime},${record.endTime},${record.remark}`)
    .join(',\n'), 'records.csv')
  downloadText('Label Id,Name,Record Number,\n' + labelStore.labels.map((label) =>
    `${label.id},${label.labelName},${records.reduce((recordNum, record) => record.labelId === label.id ? recordNum + 1 : recordNum
      , 0)}`).join(',\n'), 'labels.csv')
}
</script>

<template>
  <van-nav-bar :title="route.meta.title">
    <template #right>
      <van-popover v-model:show="showUserPop" placement="bottom-end">
        <div class="user-pop">
          <template v-if="userStore.user">
            <van-cell :title="userStore.user.displayName" icon="user" size="large" class="user-name" />
            <van-cell title="Export User Data" icon="down" @click="exportUserData" />
            <van-cell title="Import User Data" icon="upgrade" />
            <van-cell title="Sign Out" icon="exchange" @click="signOut(auth)" />
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
</style>