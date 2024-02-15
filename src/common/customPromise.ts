import {
  showNotify
} from 'vant'
import { useSystemStore } from '@/stores/system'

export default (promise: Promise<any>) => {
  const systemStore = useSystemStore()
  let isFinished = false
  const onFinal = (func: Function) => {
    if (isFinished) {
      return
    }
    isFinished = true
    func()
    systemStore.setLoading(false)
  }
  systemStore.setLoading(true)
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      onFinal(() => {
        showNotify('Network Error')
        reject(new Error('Timed out.'))
      })
    }, 8000)
    promise.then((result) => {
      onFinal(() => {
        clearTimeout(timeoutId)
        resolve(result)
      })
    }).catch((error) => {
      onFinal(() => {
        showNotify('Network Error.')
        reject(error)
      })
    })
  })
}