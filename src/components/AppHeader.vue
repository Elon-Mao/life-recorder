<script setup lang="ts">
import { ref } from 'vue'
import { NavBar, Icon, Popover } from 'vant'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth, provider } from '@/config/firebase'

const showUserPop = ref(false)
const route = useRoute()
const userStore = useUserStore()
onAuthStateChanged(auth, (user) => {
  showUserPop.value = false
  userStore.setUser(user)
})
</script>

<template>
  <nav-bar :title="route.meta.title" class="app-header">
    <template #right>
      <popover v-model:show="showUserPop" placement="bottom-end">
        <div class="user-pop">
          <template v-if="userStore.user">
            <span>{{ userStore.user.displayName }}</span>
            <span class="pop-button" @click="signOut(auth)">Logout</span>
          </template>
          <span v-else class="pop-button" @click="signInWithPopup(auth, provider)">Sign In With Google</span>
        </div>
        <template #reference>
          <div v-if="userStore.user" class="user-avatar">{{ (userStore.user.displayName || '?')[0] }}</div>
          <icon v-else name="user-circle-o" size="2rem" />
        </template>
      </popover>
    </template>
  </nav-bar>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
}

.user-pop {
  white-space: nowrap;
  display: flex;
  flex-direction: column;
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
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: rgb(114, 50, 221);
  font-size: 1.5rem;
  line-height: 2rem;
}
</style>