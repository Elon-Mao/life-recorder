import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
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
  WriteBatch,
} from 'firebase/firestore'
import { db } from '@/config/firebase'

export interface RecordData {
  id?: string
  labelId?: string
  date?: string
  startTime?: string
  endTime?: string
  remark?: string
}

const storeId = 'records'
const uninitializedError = 'Record store is uninitialized'
const briefKeys: (keyof RecordData)[] = ['labelId', 'date', 'startTime', 'endTime']
const detailKeys: (keyof RecordData)[] = ['remark']

const recordYears = Array.from(
  { length: new Date().getFullYear() - 2024 + 1 },
  (_, i) => String(2024 + i),
)

interface YearStore {
  year: string
  briefDocument?: DocumentReference
  detailCollection?: CollectionReference
  entityMap: Record<string, RecordData>
  batch: WriteBatch
  updatedData: Record<string, RecordData | FieldValue>
}

export const useRecordStore = defineStore(storeId, () => {
  let isInitialized = ref(false)
  let collectionReference: CollectionReference | undefined
  const yearStoreMap = reactive<Record<string, YearStore>>({})

  const entityToData = (entity: RecordData, keys: (keyof RecordData)[]) => {
    const data = {} as RecordData
    for (const key of keys) {
      if (entity[key] !== undefined) {
        data[key] = entity[key]
      }
    }
    return data
  }

  const entityToBrief = (entity: RecordData) => {
    return entityToData(entity, briefKeys)
  }

  const entityToDetail = (entity: RecordData) => {
    return entityToData(entity, detailKeys)
  }

  const dataToEntity = (documentData: DocumentData, entity: RecordData, keys: (keyof RecordData)[]) => {
    for (const key of keys) {
      const value = documentData[key as keyof DocumentData]
      if (value !== undefined) {
        if (value instanceof Timestamp) {
          entity[key] = value.toDate() as unknown as RecordData[keyof RecordData]
        } else {
          entity[key] = value
        }
      }
    }
  }

  const dataToBrief = (documentData: DocumentData, entity: RecordData) => {
    dataToEntity(documentData, entity, briefKeys)
  }

  const dataToDetail = (documentData: DocumentData, entity: RecordData) => {
    dataToEntity(documentData, entity, detailKeys)
  }

  const getYearFromDate = (date?: string) => {
    if (!date) {
      return ''
    }
    const match = /^(\d{4})/.exec(date)
    return match?.[1] || ''
  }

  const getYearStoreId = (year: string) => `${storeId}_${year}`

  const getOrCreateYearStore = (year: string) => {
    if (!yearStoreMap[year]) {
      yearStoreMap[year] = {
        year,
        entityMap: reactive<Record<string, RecordData>>({}),
        batch: writeBatch(db),
        updatedData: {},
      }
    }
    return yearStoreMap[year]
  }

  const getAllYearStores = () => {
    return Object.values(yearStoreMap)
  }

  const getStoreByRecord = (record: RecordData) => {
    const year = getYearFromDate(record.date)
    if (!year) {
      throw new Error(`Record date is invalid: ${record.date || ''}`)
    }
    const store = yearStoreMap[year]
    if (!store) {
      throw new Error(`Year store is not initialized: ${year}`)
    }
    return store
  }

  const getStoreById = (id: string) => {
    for (const store of getAllYearStores()) {
      if (store.entityMap[id]) {
        return store
      }
    }
    return undefined
  }

  const updateEntityMap = (store: YearStore, id: string, entity: RecordData, keys: (keyof RecordData)[]) => {
    const entityInMap = store.entityMap[id] || { id }
    for (const key of keys) {
      if (entity[key] !== undefined) {
        entityInMap[key] = entity[key]
      }
    }
    store.entityMap[id] = entityInMap
  }

  const setBriefs = (records: RecordData[]) => {
    for (const record of records) {
      if (!record.id) {
        continue
      }
      const store = getStoreByRecord(record)
      store.updatedData[record.id] = entityToBrief(record)
      updateEntityMap(store, record.id, record, briefKeys)
    }
  }

  const setDetails = (records: RecordData[]) => {
    for (const record of records) {
      if (!record.id) {
        continue
      }
      const store = getStoreByRecord(record)
      if (!store.detailCollection) {
        throw new Error(uninitializedError)
      }
      store.batch.set(doc(store.detailCollection, record.id), entityToDetail(record))
      updateEntityMap(store, record.id, record, detailKeys)
    }
  }

  const addDetails = (records: RecordData[]) => {
    for (const record of records) {
      const store = getStoreByRecord(record)
      if (!store.detailCollection) {
        throw new Error(uninitializedError)
      }
      const newDetailRef = doc(store.detailCollection)
      store.batch.set(newDetailRef, entityToDetail(record))
      record.id = newDetailRef.id
      store.entityMap[record.id] = { ...record }
    }
  }

  const deleteBriefs = (records: RecordData[]) => {
    for (const record of records) {
      if (!record.id) {
        continue
      }
      const store = getStoreById(record.id)
      if (!store) {
        continue
      }
      store.updatedData[record.id] = deleteField()
      delete store.entityMap[record.id]
    }
  }

  const deleteDetails = (records: RecordData[]) => {
    for (const record of records) {
      if (!record.id) {
        continue
      }
      const store = getStoreById(record.id)
      if (!store) {
        continue
      }
      if (!store.detailCollection) {
        throw new Error(uninitializedError)
      }
      store.batch.delete(doc(store.detailCollection, record.id))
    }
  }

  const getDetails = async (records: RecordData[]) => {
    await Promise.all(records.map(async (record) => {
      if (!record.id) {
        return
      }
      const store = getStoreById(record.id)
      if (!store || !store.detailCollection) {
        return
      }
      const documentSnapshot = await getDoc(doc(store.detailCollection, record.id))
      if (documentSnapshot.exists()) {
        dataToDetail(documentSnapshot.data(), record)
        store.entityMap[record.id] = record
      }
    }))
  }

  const initYearStore = async (year: string) => {
    if (!collectionReference) {
      throw new Error(uninitializedError)
    }

    const store = getOrCreateYearStore(year)
    store.briefDocument = doc(collectionReference, getYearStoreId(year))
    store.detailCollection = collection(collectionReference, getYearStoreId(year), 'details')

    const documentSnapshot = await getDoc(store.briefDocument)

    Object.keys(store.entityMap).forEach((id) => {
      delete store.entityMap[id]
    })

    if (documentSnapshot.exists()) {
      const documentDataMap = documentSnapshot.data()
      for (const [id, documentData] of Object.entries(documentDataMap)) {
        store.entityMap[id] = { id }
        dataToBrief(documentData, store.entityMap[id])
      }
    } else {
      await setDoc(store.briefDocument, {})
    }
  }

  const init = async (ref: CollectionReference) => {
    collectionReference = ref
    await Promise.all(recordYears.map((year) => initYearStore(year)))
    isInitialized.value = true
  }

  const entities = computed(() => {
    const result: RecordData[] = []
    for (const store of getAllYearStores()) {
      for (const id in store.entityMap) {
        result.push(store.entityMap[id])
      }
    }
    return result.sort((e0, e1) => e0.id!.localeCompare(e1.id!))
  })

  const setEntities = (records: RecordData[]) => {
    setDetails(records)
    setBriefs(records)
  }

  const setEntity = (record: RecordData) => {
    setEntities([record])
  }

  const addEntity = (record: RecordData) => {
    addDetails([record])
    setBriefs([record])
  }

  const commit = async () => {
    for (const store of getAllYearStores()) {
      if (!store.briefDocument) {
        throw new Error(uninitializedError)
      }
      if (Object.keys(store.updatedData).length === 0) {
        continue
      }
      store.batch.update(store.briefDocument, store.updatedData)
      await store.batch.commit()
      store.batch = writeBatch(db)
      store.updatedData = {}
    }
  }

  const listBylabelId = (labelId: string) => {
    return entities.value.filter((record) => record.labelId === labelId)
  }

  const listByDate = async (date: string) => {
    const year = getYearFromDate(date)
    const store = yearStoreMap[year]
    if (!store) {
      return []
    }
    const records = Object.values(store.entityMap).filter((record) => record.date === date)
    await getDetails(records)
    return records
  }

  const deleteRecord = async (id: string) => {
    const store = getStoreById(id)
    if (!store) {
      return
    }
    const record = store.entityMap[id]
    if (!record) {
      return
    }
    deleteDetails([record])
    deleteBriefs([record])
    await commit()
  }

  return {
    isInitialized,
    init,
    entities,
    setEntities,
    commit,
    listBylabelId,
    deleteRecord,
    setEntity,
    addEntity,
    listByDate,
  }
})