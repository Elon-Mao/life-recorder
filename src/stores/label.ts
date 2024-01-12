import { defineStore } from 'pinia'

export interface Label {
  id: string
  name: string
}

export const useLabelStore = defineStore('label', {
  state: () => {
    return {
      labels: [{
        id: '1',
        name: 'Study English'
      }, {
        id: '2',
        name: 'Code111111111111111111111111111111111111111111111111111111111111111111111111'
      }, {
        id: '3',
        name: 'Exercise'
      }, {
        id: '4',
        name: 'Exercise2'
      }, {
        id: '5',
        name: 'Exercise3'
      }, {
        id: '6',
        name: 'Exercise4'
      }, {
        id: '7',
        name: 'Exercise5'
      }, {
        id: '8',
        name: 'Exercise6'
      }, {
        id: '9',
        name: 'Exercise7'
      }, {
        id: '10',
        name: 'Exercise8'
      }, {
        id: '11',
        name: 'Exercise9'
      }, {
        id: '12',
        name: 'Exercise10'
      }, {
        id: '13',
        name: 'Exercise11'
      }, {
        id: '14',
        name: 'Exercise12'
      }, {
        id: '15',
        name: 'Exercise13'
      }] as Label[]
    }
  },
  actions: {
    rename(index: number, newName: string) {
      this.labels[index].name = newName
    },
    addLabel(labelName: string) {
      this.labels.unshift({
        id: '123',
        name: labelName
      })
    }
  },
})