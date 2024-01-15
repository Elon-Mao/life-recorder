import {
  showNotify
} from 'vant'
import { useSystemStore } from '@/stores/system'

export const customAsync = async (func: Function) => {
  const systemStore = useSystemStore()
  systemStore.setLoading(true)
  const timeoutId = setTimeout(() => {
    throw new Error('Timed out')
  }, 8000)
  try {
    const result = await func()
    clearTimeout(timeoutId);
    systemStore.setLoading(false)
    return result
  } catch(e) {
    systemStore.setLoading(false)
    showNotify('Network Error')
    throw e
  }
}