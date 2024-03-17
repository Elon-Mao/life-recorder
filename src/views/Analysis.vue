<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  RadioGroup as VanRadioGroup,
  Radio as VanRadio
} from 'vant'
import * as echarts from 'echarts'
import {
  query,
  where,
  getDocs
} from 'firebase/firestore'
import { useUserStore } from '@/stores/user'
import { useLabelStore } from '@/stores/label'
import { calculateSpan } from '@/common/convertToRecord'
import RecordForm from '@/types/RecordForm'
import { dayMills, getFormatDate, mintues30 } from '@/common/dateTools'
import { CallbackDataParams } from 'echarts/types/dist/shared.js'

const route = useRoute()
const userStore = useUserStore()
const labelStore = useLabelStore()
const recordCollection = userStore.getRecordsCollection()

const gridDom = ref(null)
let chartGrid: echarts.EChartsType
onMounted(() => {
  chartGrid = echarts.init(gridDom.value)
  if (route.query.labelId) {
    loadSingleChart()
  } else {
    loadMultiChart()
  }
})
watch(
  () => route.query.labelId,
  async (newId) => {
    if (newId && chartGrid) {
      loadSingleChart()
    }
  }
)

declare type spanData = [string?, number?]

interface LabelSet {
  name: string,
  labels: string[]
  dateSpanMap: Record<string, number>
  dateSpans: spanData[]
}

const loadMultiChart = async () => {
  const labelSets: LabelSet[] = [{
    name: 'Studying English',
    labels: ['AS44HIQqRwzV6kCej2rE', 'vI2mPDqbYFafcq58DqVB'],
    dateSpanMap: {},
    dateSpans: []
  }, {
    name: 'Coding',
    labels: ['sONqEVfWPxMMpkfRk6dw', 'EvMZueaN14DkvKe4fZBn', 'mzhn1hVEPTSatWdyCy2f', 'LKUwkiPELOgdpYWYlCgq'],
    dateSpanMap: {},
    dateSpans: []
  }]

  let minDateStr = getFormatDate(new Date())
  for (const labelSet of labelSets) {
    for (const labelId of labelSet.labels) {
      const querySnapshot = await getDocs(query(recordCollection, where('labelId', '==', labelId)))
      querySnapshot.forEach((document) => {
        const recordForm = document.data() as RecordForm
        recordForm.startTimeParts = recordForm.startTime!.split(':')
        recordForm.endTimeParts = recordForm.endTime!.split(':')
        calculateSpan(recordForm)
        const date = recordForm.date!
        if (date < minDateStr) {
          minDateStr = date
        }
        let dateSpan = labelSet.dateSpanMap[date]
        if (!dateSpan) {
          dateSpan = 0
        }
        labelSet.dateSpanMap[date] = dateSpan + recordForm.span!
      })
    }
  }
  const maxDate = new Date()
  const minDate = new Date(minDateStr)
  let loopDate = new Date(minDate)
  const dateSums: number[] = []
  while (loopDate <= maxDate) {
    const formatDate = getFormatDate(loopDate)
    let dateSum = 0
    labelSets.forEach((labelSet) => {
      const dateSpan = labelSet.dateSpanMap[formatDate]
      if (dateSpan) {
        dateSum += dateSpan
        labelSet.dateSpans.push([`${formatDate} 12`, dateSpan])
      } else {
        labelSet.dateSpans.push([])
      }
    })
    dateSums.push(dateSum)
    loopDate.setDate(loopDate.getDate() + 1)
  }
  minDate.setDate(minDate.getDate() - 1)
  maxDate.setHours(24)
  const startDate = new Date(maxDate)
  startDate.setDate(startDate.getDate() - 7)
  chartGrid.setOption({
    dataZoom: [{
      type: 'inside',
      zoomLock: true,
      startValue: startDate,
      endValue: maxDate,
      filterMode: 'none',
    }],
    legend: {
      type: 'scroll',
      selectedMode: false
    },
    grid: {
      left: 0,
      right: 0,
    },
    xAxis: {
      type: 'time',
      axisLabel: {
        formatter: '{MM}-{dd}',
        align: 'left'
      },
      minInterval: dayMills,
      maxInterval: dayMills,
      min: minDate.getTime(),
      max: maxDate.getTime(),
    },
    yAxis: {
      type: 'value',
      offset: -80,
      zlevel: 1,
      axisLabel: {
        showMinLabel: false,
        formatter: '{value} min',
        color: 'blue',
        textBorderColor: 'blue',
        textBorderWidth: 1,
      }
    },
    series: labelSets.map((labelSet) => {
      return {
        name: labelSet.name,
        type: 'bar',
        stack: 'span',
        barWidth: '80%',
        label: {
          show: true,
          formatter: (params: CallbackDataParams) => {
            const spanDate = params.value as spanData
            if (spanDate.length) {
              return `${spanDate[1]}min\n${Math.round(spanDate[1]! * 1000 / dateSums[params.dataIndex]) / 10}%`
            } else {
              return ''
            }
          }
        },
        data: labelSet.dateSpans
      }
    })
  })
}

const getRecords = async (labelId: string) => {
  const querySnapshot = await getDocs(query(recordCollection, where('labelId', '==', labelId)))
  const records: RecordForm[] = []
  querySnapshot.forEach((document) => {
    const recordForm = document.data() as RecordForm
    recordForm.startTimeParts = recordForm.startTime!.split(':')
    recordForm.endTimeParts = recordForm.endTime!.split(':')
    calculateSpan(recordForm)
    records.push(recordForm)
  })
  return records
}

const getTypeOption = () => {
  const labelId = route.query.labelId as string
  const name = labelStore.labels.find((label) => label.id === labelId)!.labelName
  switch (chartType.value) {
    case '1':
      return {
        yAxis: {
          type: 'value',
          offset: -80,
          zlevel: 1,
          axisLabel: {
            showMinLabel: false,
            formatter: '{value} min',
            color: 'blue',
            textBorderColor: 'blue',
            textBorderWidth: 1,
          }
        },
        series: {
          name,
          type: 'bar',
          barWidth: '80%',
          data: labelRecords.map((record) => {
            return [`${record.date} 12`, record.span]
          })
        }
      }
    case '2':
      const maxDate = new Date()
      const startDate = new Date()
      maxDate.setDate(maxDate.getDate() + 10)
      startDate.setDate(startDate.getDate() - 120)
      return {
        dataZoom: [{
          type: 'inside',
          zoomLock: true,
          startValue: startDate,
          endValue: maxDate,
          filterMode: 'none',
        }],
        xAxis: {
          type: 'time',
          axisLine: {
            show: true,
          },
          axisTick: {
            show: true,
          },
          min: ({ min }: { min: number }) => Math.min(startDate.getTime(), min - dayMills * 10),
          max: maxDate,
        },
        yAxis: {
          type: 'time',
          offset: -50,
          zlevel: 1,
          min: ({ min }: { min: number }) => {
            return min - mintues30
          },
          max: 'dataMax',
          axisLabel: {
            formatter: '{HH}:{mm}',
            color: 'blue',
            textBorderColor: 'blue',
            textBorderWidth: 1,
          }
        },
        series: {
          name,
          type: 'scatter',
          data: labelRecords.map((record) => {
            return [record.date, new Date('1970/01/01 ' + record.startTime)]
          })
        }
      }
    case '3':
      return {
        yAxis: {
          type: 'value',
          name: 'Times',
          nameTextStyle: {
            color: 'blue',
            textBorderColor: 'blue',
            textBorderWidth: 1,
          },
          offset: -30,
          zlevel: 1,
          minInterval: 1,
          min: 0,
          max: 'dataMax',
          axisLabel: {
            showMinLabel: false,
            color: 'blue',
            textBorderColor: 'blue',
            textBorderWidth: 1,
          }
        },
        series: {
          name,
          type: 'bar',
          data: labelRecords.reduce((recordGroup: RecordForm[][], record) => {
            const foundGroup = recordGroup.find(group => group[0].date === record.date)
            if (foundGroup) {
              foundGroup.push(record)
            } else {
              recordGroup.push([record])
            }
            return recordGroup
          }, []).map((group) => {
            return [`${group[0].date} 12`, group.length]
          })
        }
      }
  }
  return {}
}

const loadChartByType = async () => {
  const maxDate = new Date()
  const minDate = new Date(recordMinDate)
  minDate.setDate(minDate.getDate() - 1)
  maxDate.setHours(24)
  const startDate = new Date(maxDate)
  startDate.setDate(startDate.getDate() - 7)

  chartGrid.clear()
  const commonOption = {
    dataZoom: [{
      type: 'inside',
      zoomLock: true,
      startValue: startDate,
      endValue: maxDate,
      filterMode: 'none',
    }],
    legend: {
      selectedMode: false
    },
    grid: {
      left: 0,
      right: 0,
    },
    xAxis: {
      type: 'time',
      axisLabel: {
        formatter: '{MM}-{dd}',
        align: 'left'
      },
      minInterval: dayMills,
      maxInterval: dayMills,
      min: minDate.getTime(),
      max: maxDate.getTime(),
    },
  }

  chartGrid.setOption({
    ...commonOption,
    ...getTypeOption()
  })
}

const loadSingleChart = async () => {
  const labelId = route.query.labelId as string
  labelRecords = await getRecords(labelId)
  recordMinDate = getFormatDate(new Date())
  for (const record of labelRecords) {
    const date = record.date!
    if (date < recordMinDate) {
      recordMinDate = date
    }
  }
  loadChartByType()
}

const chartType = ref('1')
let labelRecords: RecordForm[] = []
let recordMinDate = ''
</script>

<template>
  <div class="chart-container">
    <div class="chart-grid" ref="gridDom"></div>
    <van-radio-group v-model="chartType" direction="horizontal" :onChange="loadChartByType">
      <van-radio name="1">Time Span</van-radio>
      <van-radio name="2">Start Time</van-radio>
      <van-radio name="3">Record Num</van-radio>
    </van-radio-group>
  </div>
</template>

<style scoped>
.chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chart-grid {
  width: 100dvw;
  height: 50dvh;
}
</style>