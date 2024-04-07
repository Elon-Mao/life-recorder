import { ref, Ref } from 'vue'
import { defineStore } from 'pinia'
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  Timestamp,
} from 'firebase/firestore'
import type {
  CollectionReference,
  DocumentData,
  FieldValue,
} from 'firebase/firestore'

export interface BaseEntity {
  id?: string
}

export const elonStore = <Entity extends BaseEntity>(
  storeId: string,
  collectionReference: CollectionReference,
  briefKeys: (keyof Entity)[],
  detailKeys: (keyof Entity)[] = [],
) => {
  const briefDocument = doc(collectionReference, storeId)
  const detailCollection = collection(collectionReference, storeId, 'details')

  const getDetailDoc = (id: string) => {
    return doc(detailCollection, id)
  }

  const entityToData = (entity: Entity, keys: (keyof Entity)[]) => {
    const data = {} as Entity
    for (const key of keys) {
      if (entity[key] !== undefined) {
        data[key] = entity[key]
      }
    }
    return data
  }

  const entityToBrief = (entity: Entity) => {
    return entityToData(entity, briefKeys)
  }

  const entityToDetail = (entity: Entity) => {
    return entityToData(entity, detailKeys)
  }

  const dataToEntity = (documentData: DocumentData, entity: Entity, keys: (keyof Entity)[]) => {
    for (const key of keys) {
      const value = documentData[key as keyof DocumentData]
      if (value !== undefined) {
        if (value instanceof Timestamp) {
          entity[key] = value.toDate() as Entity[keyof Entity]
        } else {
          entity[key] = value
        }
      }
    }
  }

  const dataToBrief = (documentData: DocumentData, entity: Entity) => {
    return dataToEntity(documentData, entity, briefKeys)
  }

  const dataToDetail = (documentData: DocumentData, entity: Entity) => {
    return dataToEntity(documentData, entity, detailKeys)
  }

  const batchAction = async (entities: Entity[], callbackfn: (entity: Entity) => Promise<void>) => {
    await Promise.all(entities.map(callbackfn))
  }

  return defineStore(storeId, {
    state: () => {
      return {
        entityMap: {} as Record<string, Entity>,
        entities: ref<Entity[]>([]) as Ref<Entity[]>
      }
    },
    actions: {
      async init() {
        const documentSnapshot = await getDoc(briefDocument)
        if (documentSnapshot.exists()) {
          const documentDataMap = documentSnapshot.data()
          for (const [id, documentData] of Object.entries(documentDataMap)) {
            this.entityMap[id] = {
              id
            } as Entity
            dataToBrief(documentData, this.entityMap[id])
          }
        } else {
          await setDoc(briefDocument, {})
          this.entityMap = {}
        }
        this.createArrayFromMap()
      },
      createArrayFromMap() {
        this.entities = []
        for (const id in this.entityMap) {
          this.entities.push(this.entityMap[id])
        }
        return this.entities.sort((e0, e1) => e0.id!.localeCompare(e1.id!))
      },
      async addEntity(entity: Entity) {
        await this.addEntities([entity])
      },
      async addEntities(entities: Entity[]) {
        await this._addDetails(entities)
        await this.setBriefs(entities)
        this.createArrayFromMap()
      },
      async setDetail(entity: Entity) {
        if (!entity.id) {
          return
        }
        await setDoc(getDetailDoc(entity.id), entityToDetail(entity))
      },
      async setDetails(entities: Entity[]) {
        await batchAction(entities, (entity) => this.setDetail(entity))
      },
      async setBrief(entity: Entity) {
        await this.setBriefs([entity])
      },
      async setBriefs(
        entities: Entity[],
        fieldGetter: (entity: Entity) => FieldValue = (entity) => entityToBrief(entity) as unknown as FieldValue
      ) {
        const updatedData: Record<string, FieldValue> = {}
        for (const entity of entities) {
          if (entity.id) {
            updatedData[entity.id] = fieldGetter(entity)
          }
        }
        await updateDoc(briefDocument, updatedData)
      },
      async setEntity(entity: Entity) {
        await this.setEntities([entity])
      },
      async setEntities(entities: Entity[]) {
        await Promise.all([
          this.setDetails(entities),
          this.setBriefs(entities)
        ])
      },
      async getDetail(entity: Entity) {
        if (!entity.id) {
          return
        }
        const documentSnapshot = await getDoc(getDetailDoc(entity.id))
        if (documentSnapshot.exists()) {
          dataToDetail(documentSnapshot.data(), entity)
        }
      },
      async getDetails(entities: Entity[]) {
        await batchAction(entities, (entity) => this.getDetail(entity))
      },
      async deleteEntity(entity: Entity) {
        await this.deleteEntities([entity])
      },
      async deleteEntities(entities: Entity[]) {
        await Promise.all([
          this._deleteDetails(entities),
          this.setBriefs(entities, () => deleteField())
        ])
        this.createArrayFromMap()
      },
      async _addDetail(entity: Entity) {
        const documentReference = await addDoc(detailCollection, entityToDetail(entity))
        entity.id = documentReference.id
        this.entityMap[entity.id] = entity
      },
      async _addDetails(entities: Entity[]) {
        await batchAction(entities, (entity) => this._addDetail(entity))
      },
      async _deleteDetail(entity: Entity) {
        if (!entity.id) {
          return
        }
        await deleteDoc(getDetailDoc(entity.id))
        delete this.entityMap[entity.id]
      },
      async _deleteDetails(entities: Entity[]) {
        await batchAction(entities, (entity) => this._deleteDetail(entity))
      }
    }
  })
}
