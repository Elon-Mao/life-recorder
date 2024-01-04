import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { Locale } from 'vant'
import enUS from 'vant/es/locale/lang/en-US'

import 'vant/lib/index.css'
import './style.css'

Locale.use('en-US', enUS)
createApp(App).use(createPinia()).use(router).mount('#app')
