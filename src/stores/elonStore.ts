import { reactive, computed } from 'vue'
import {
  writeBatch,
  collection,
  doc,
  getDoc,
  setDoc,
  deleteField,
  Timestamp,
} from 'firebase/firestore'
import type {
  CollectionReference,
  DocumentData,
  DocumentReference,
  FieldValue,
} from 'firebase/firestore'
import { db } from '@/config/firebase'

export interface BaseEntity {
  id?: string
}

const uninitializedError = 'Store is uninitialized'

export const useElonStore = <Entity extends BaseEntity>(
  storeId: string,
  briefKeys: (keyof Entity)[],
  detailKeys: (keyof Entity)[] = [],
) => {
  let briefDocument: DocumentReference | undefined
  let detailCollection: CollectionReference | undefined
  const entityMap = reactive<Record<string, Entity>>({})
  let batch = writeBatch(db)
  let updatedData: Record<string, Entity | FieldValue> = {}

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
    dataToEntity(documentData, entity, briefKeys)
  }

  const dataToDetail = (documentData: DocumentData, entity: Entity) => {
    dataToEntity(documentData, entity, detailKeys)
  }

  const init = async (collectionReference: CollectionReference) => {
    briefDocument = doc(collectionReference, storeId)
    detailCollection = collection(collectionReference, storeId, 'details')
    const documentSnapshot = await getDoc(briefDocument)
    Object.keys(entityMap).forEach(id => {
      delete entityMap[id]
    })
    if (documentSnapshot.exists()) {
      const documentDataMap = documentSnapshot.data()
      for (const [id, documentData] of Object.entries(documentDataMap)) {
        entityMap[id] = {
          id
        } as Entity
        dataToBrief(documentData, entityMap[id])
      }
    } else {
      await setDoc(briefDocument, {})
    }
  }

  const addEntity = (entity: Entity) => {
    addEntities([entity])
  }

  const addEntities = (entities: Entity[]) => {
    _addDetails(entities)
    setBriefs(entities)
  }

  const setBrief = (entity: Entity) => {
    setBriefs([entity])
  }

  const setBriefs = (entities: Entity[]) => {
    for (const entity of entities) {
      if (entity.id) {
        updatedData[entity.id] = entityToBrief(entity)
        _updateEntityMap(entity.id, entity, briefKeys)
      }
    }
  }

  const setDetail = (entity: Entity) => {
    setDetails([entity])
  }

  const setDetails = (entities: Entity[]) => {
    if (!detailCollection) {
      throw new Error(uninitializedError)
    }
    for (const entity of entities) {
      if (entity.id) {
        batch.set(doc(detailCollection, entity.id), entityToDetail(entity))
        _updateEntityMap(entity.id, entity, detailKeys)
      }
    }
  }

  const setEntity = (entity: Entity) => {
    setEntities([entity])
  }

  const setEntities = (entities: Entity[]) => {
    setDetails(entities)
    setBriefs(entities)
  }

  const getDetail = async (entity: Entity) => {
    await getDetails([entity])
  }

  const getDetails = async (entities: Entity[]) => {
    if (!detailCollection) {
      throw new Error(uninitializedError)
    }
    await Promise.all(entities.map(async (entity) => {
      if (entity.id) {
        const documentSnapshot = await getDoc(doc(detailCollection!, entity.id))
        if (documentSnapshot.exists()) {
          dataToDetail(documentSnapshot.data(), entity)
        }
      }
    }))
  }

  const deleteEntity = (entity: Entity) => {
    deleteEntities([entity])
  }

  const deleteEntities = (entities: Entity[]) => {
    _deleteDetails(entities)
    _deleteBriefs(entities)
  }

  const commit = async () => {
    if (!briefDocument) {
      throw new Error(uninitializedError)
    }
    batch.update(briefDocument, updatedData)
    await batch.commit()
    batch = writeBatch(db)
    updatedData = {}
  }

  const _updateEntityMap = (id: string, entity: Entity, keys: (keyof Entity)[]) => {
    const entityInMap = entityMap[id] || {
      id: entity.id
    }
    for (const key of keys) {
      entityInMap[key] = entity[key]
    }
    entityMap[id] = entityInMap
  }

  const _addDetails = (entities: Entity[]) => {
    if (!detailCollection) {
      throw new Error(uninitializedError)
    }
    for (const entity of entities) {
      const newDetailRef = doc(detailCollection)
      batch.set(newDetailRef, entityToDetail(entity))
      entity.id = newDetailRef.id
      entityMap[entity.id] = entity
    }
  }

  const _deleteBriefs = (entities: Entity[]) => {
    for (const entity of entities) {
      if (entity.id) {
        updatedData[entity.id] = deleteField()
        delete entityMap[entity.id]
      }
    }
  }

  const _deleteDetails = (entities: Entity[]) => {
    if (!detailCollection) {
      throw new Error(uninitializedError)
    }
    for (const entity of entities) {
      entity.id && batch.delete(doc(detailCollection, entity.id))
    }
  }

  const entities = computed(() => {
    const entities = []
    for (const id in entityMap) {
      entities.push(entityMap[id])
    }
    return entities.sort((e0, e1) => e0.id!.localeCompare(e1.id!))
  })

  return {
    entityMap,
    briefDocument,
    detailCollection,
    entityToData,
    entityToBrief,
    entityToDetail,
    dataToEntity,
    dataToBrief,
    dataToDetail,
    init,
    addEntity,
    addEntities,
    setBrief,
    setBriefs,
    setDetail,
    setDetails,
    setEntity,
    setEntities,
    getDetail,
    getDetails,
    deleteEntity,
    deleteEntities,
    commit,
    entities,
    _updateEntityMap,
    _addDetails,
    _deleteBriefs,
    _deleteDetails,
  }
}
