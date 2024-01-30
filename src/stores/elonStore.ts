import { defineStore } from 'pinia'
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  onSnapshot,
  type WithFieldValue,
  type DocumentData
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import customPromise from '@/common/customPromise'

export const elonStore = <
  BriefWithoutId extends WithFieldValue<DocumentData>,
  Entity extends BriefWithoutId
>(
  storeId: string,
  briefKeys: (keyof BriefWithoutId)[],
  entityKeys: (keyof Omit<Entity, keyof BriefWithoutId>)[]
) => {
  type BriefEntity = BriefWithoutId & {
    id: string
  }
  type EntityWithoutBrief = Omit<Entity, keyof BriefWithoutId>

  const useStore = defineStore(storeId, {
    state: () => {
      return {
        entityMap: {} as Record<string, Entity>,
        briefEntities: [] as BriefEntity[],
        briefEntityMap: {} as Record<string, BriefWithoutId>,
      }
    },
    actions: {
      getById(id: string, callback: (entity: Entity) => void = () => {}) {
        if (!id) {
          return
        }
        if (this.entityMap[id]) {
          callback(this.entityMap[id])
          return
        }
        onSnapshot(doc(storeCollection, id), (newDoc) => {
          const entity = {
            ...newDoc.data(),
            ...this.briefEntityMap[id]
          } as Entity
          this.entityMap[id] = entity
          callback(entity)
          callback = () => {}
        })
      },
      async setById(id: string, entity: Entity) {
        const entityWithoutBrief = {} as EntityWithoutBrief
        const briefWithoutId = {} as BriefWithoutId
        Object.keys(entity).forEach((key) => {
          if (briefKeys.includes(key)) {
            briefWithoutId[key] = entity[key]
          } else {
            const key1 = key as keyof EntityWithoutBrief
            if (entityKeys.includes(key1)) {
              entityWithoutBrief[key1] = entity[key1]
            }
          }
        })

        await customPromise(
          Promise.all([
            setDoc(doc(storeCollection, id), entityWithoutBrief),
            updateDoc(briefDoc, {
              [id]: briefWithoutId
            })
          ])
        )
      },
      async addEntity(entity: Entity) {
        const newDoc = doc(storeCollection)
        this.getById(newDoc.id)
        await this.setById(newDoc.id, entity)
        return newDoc.id
      },
      async deleteById(id: string) {
        await customPromise(
          Promise.all([
            deleteDoc(doc(storeCollection, id)),
            updateDoc(briefDoc, {
              [id]: deleteField()
            })
          ])
        )
        delete this.entityMap[id]
        delete this.briefEntityMap[id]
      },
      async getAll() {
        this.briefEntities.forEach((briefEntity) => {
          this.getById(briefEntity.id)
        })
        return new Promise((resolve) => {
          const intervalId = setInterval(() => {
            if (Object.keys(this.entityMap).length === this.briefEntities.length) {
              clearInterval(intervalId)
              resolve(this.briefEntities.map((briefEntity) => {
                return {
                  id: briefEntity.id,
                  ...this.entityMap[briefEntity.id]
                }
              }))
            }
          }, 500)
        })
      }
    }
  })

  const store = useStore()
  const storeCollection = collection(db, storeId)
  const briefDoc = doc(storeCollection, 'briefEntities')
  onSnapshot(
    briefDoc,
    (newDoc) => {
      const briefData = newDoc.data()
      if (!briefData) {
        return
      }
      store.briefEntities = Object.entries(briefData).map(([id, brief]) => {
        store.briefEntityMap[id] = brief
        return {
          id,
          ...brief
        }
      })
    }
  )
  return useStore
}
