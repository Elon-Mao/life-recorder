import {
  showNotify
} from 'vant'
import { useSystemStore } from '@/stores/system'

function timeoutPromise(ms: number) {
  return new Promise((_resolve, reject) => {
    setTimeout(() => {
      reject(new Error('Timeout'));
    }, ms);
  });
}

export default async <T>(promise: Promise<T>) => {
  const systemStore = useSystemStore()
  systemStore.setLoading(true)
  try {
    return await Promise.race<T>([
      promise,
      timeoutPromise(8000) as Promise<T>
    ])
  } catch (error) {
    if (error instanceof Error) {
      showNotify(error.message)
    }
    throw error
  } finally {
    systemStore.setLoading(false)
  }
}
