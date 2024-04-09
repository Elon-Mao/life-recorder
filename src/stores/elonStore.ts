import { reactive, computed } from 'vue'
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
  DocumentReference,
  FieldValue,
} from 'firebase/firestore'

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

  const getDetailDoc = (id: string) => {
    if (!detailCollection) {
      throw new Error(uninitializedError)
    }
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

  const addEntity = async (entity: Entity) => {
    await addEntities([entity])
  }

  const addEntities = async (entities: Entity[]) => {
    await _addDetails(entities)
    await setBriefs(entities)
  }

  const setDetail = async (entity: Entity) => {
    if (!entity.id) {
      return
    }
    await setDoc(getDetailDoc(entity.id), entityToDetail(entity))
  }

  const setDetails = async (entities: Entity[]) => {
    await batchAction(entities, (entity) => setDetail(entity))
  }

  const setBrief = async (entity: Entity) => {
    await setBriefs([entity])
  }

  const setBriefs = async (
    entities: Entity[],
    fieldGetter: (entity: Entity) => FieldValue = (entity) => entityToBrief(entity) as unknown as FieldValue
  ) => {
    if (!briefDocument) {
      throw new Error(uninitializedError)
    }
    const updatedData: Record<string, FieldValue> = {}
    for (const entity of entities) {
      if (entity.id) {
        updatedData[entity.id] = fieldGetter(entity)
      }
    }
    await updateDoc(briefDocument, updatedData)
  }

  const setEntity = async (entity: Entity) => {
    await setEntities([entity])
  }

  const setEntities = async (entities: Entity[]) => {
    await Promise.all([
      setDetails(entities),
      setBriefs(entities)
    ])
  }

  const getDetail = async (entity: Entity) => {
    if (!entity.id) {
      return
    }
    const documentSnapshot = await getDoc(getDetailDoc(entity.id))
    if (documentSnapshot.exists()) {
      dataToDetail(documentSnapshot.data(), entity)
    }
  }

  const getDetails = async (entities: Entity[]) => {
    await batchAction(entities, (entity) => getDetail(entity))
  }

  const deleteEntity = async (entity: Entity) => {
    await deleteEntities([entity])
  }

  const deleteEntities = async (entities: Entity[]) => {
    await Promise.all([
      _deleteDetails(entities),
      setBriefs(entities, () => deleteField())
    ])
  }

  const _addDetail = async (entity: Entity) => {
    if (!detailCollection) {
      throw new Error(uninitializedError)
    }
    const documentReference = await addDoc(detailCollection, entityToDetail(entity))
    entity.id = documentReference.id
    entityMap[entity.id] = entity
  }

  const _addDetails = async (entities: Entity[]) => {
    await batchAction(entities, (entity) => _addDetail(entity))
  }

  const _deleteDetail = async (entity: Entity) => {
    if (!entity.id) {
      return
    }
    await deleteDoc(getDetailDoc(entity.id))
    delete entityMap[entity.id]
  }

  const _deleteDetails = async (entities: Entity[]) => {
    await batchAction(entities, (entity) => _deleteDetail(entity))
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
    getDetailDoc,
    entityToData,
    entityToBrief,
    entityToDetail,
    dataToEntity,
    dataToBrief,
    dataToDetail,
    batchAction,
    init,
    addEntity,
    addEntities,
    setDetail,
    setDetails,
    setBrief,
    setBriefs,
    setEntity,
    setEntities,
    getDetail,
    getDetails,
    deleteEntity,
    deleteEntities,
    _addDetail,
    _addDetails,
    _deleteDetail,
    _deleteDetails,
    entities,
  }
}
