import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

import 'vant/lib/index.css'
import './style.css'

createApp(App).use(createPinia()).use(router).mount('#app')
