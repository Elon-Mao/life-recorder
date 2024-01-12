<script setup lang="ts">
import { ref } from 'vue'
import {
  NavBar as VanNavBar,
  Icon as VanIcon,
  Popover as VanPopover
} from 'vant'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth, provider } from '@/config/firebase'

const showUserPop = ref(false)
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
onAuthStateChanged(auth, (user) => {
  showUserPop.value = false
  userStore.setUser(user)
  router.push('/')
})
</script>

<template>
  <van-nav-bar :title="route.meta.title">
    <template #right>
      <van-popover v-model:show="showUserPop" placement="bottom-end">
        <div class="user-pop">
          <template v-if="userStore.user">
            <div>
              <van-icon name="user-circle-o" size="1.5rem" />
              <span>{{ userStore.user.displayName }}</span>
            </div>
            <span class="pop-button" @click="signOut(auth)">Logout</span>
          </template>
          <span v-else class="pop-button" @click="signInWithPopup(auth, provider)">Sign In With Google</span>
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
  white-space: nowrap;
  display: flex;
  flex-direction: column;
}

.user-pop>div {
  height: 2rem;
  display: flex;
  align-items: flex-end;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
}

.user-pop>span {
  padding: 0.5rem 1rem;
}

.pop-button {
  cursor: pointer;
}

.pop-button:active {
  background-color: rgb(242, 243, 245);
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