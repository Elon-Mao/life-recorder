<script setup lang="ts">
import { ref, onActivated } from 'vue'
import * as echarts from 'echarts'
import {
  query,
  where,
  getDocs
} from 'firebase/firestore'
import { useUserStore } from '@/stores/user'
// import { useLabelStore } from '@/stores/label'
import { calculateSpan } from '@/common/convertToRecord'
import RecordForm from '@/types/RecordForm'
import { dayMills, getFormatDate } from '@/common/dateTools'
import { CallbackDataParams } from 'echarts/types/dist/shared.js'

const userStore = useUserStore()
// const labelStore = useLabelStore()
const recordCollection = userStore.getRecordsCollection()

const gridDom = ref(null)
let chartGrid: echarts.EChartsType
onActivated(() => {
  chartGrid = echarts.init(gridDom.value)
  loadChart()
})

declare type spanData = [string?, number?]

interface LabelSet {
  name: string,
  labels: string[]
  dateSpanMap: Record<string, number>
  dateSpans: spanData[]
}

const loadChart = async () => {
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

  let maxDateStr = '1970/01/01'
  let minDateStr = getFormatDate(new Date())
  for (const labelSet of labelSets) {
    for (const labelId of labelSet.labels) {
      const querySnapshot = await getDocs(query(recordCollection, where('labelId', '==', labelId)))
      querySnapshot.forEach(async (document) => {
        const recordForm = document.data() as RecordForm
        recordForm.startTimeParts = recordForm.startTime!.split(':')
        recordForm.endTimeParts = recordForm.endTime!.split(':')
        calculateSpan(recordForm)
        const date = recordForm.date!
        if (date > maxDateStr) {
          maxDateStr = date
        }
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
  const maxDate = new Date(maxDateStr)
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
  maxDate.setDate(maxDate.getDate() + 1)
  minDate.setDate(minDate.getDate() - 1)

  const startDate = new Date(maxDate)
  startDate.setDate(startDate.getDate() - 7)
  chartGrid.setOption({
    dataZoom: [{
      type: 'inside',
      zoomLock: true,
      startValue: startDate,
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
      offset: -50,
      zlevel: 1,
      axisLabel: {
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
              return Math.round(spanDate[1]! * 1000 / dateSums[params.dataIndex]) / 10 + '%'
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
</script>

<template>
  <div class="chart-grid" ref="gridDom"></div>
</template>

<style scoped>
.chart-grid {
  width: 100dvw;
  height: 50dvh;
}
</style>