<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
import { dayMills, getDaysDifference, getFormatDate } from '@/common/dateTools'

const userStore = useUserStore()
// const labelStore = useLabelStore()
const recordCollection = userStore.getRecordsCollection()

const legendDom = ref(null)
const gridDom = ref(null)
let chartLegend: echarts.EChartsType
let chartGrid: echarts.EChartsType
onMounted(() => {
  chartLegend = echarts.init(legendDom.value)
  chartGrid = echarts.init(gridDom.value)
  loadChart()
})

interface LabelSet {
  name: string,
  labels: string[]
  dateSpanMap: Record<string, number>
  dateSpans: [string?, number?][]
}

const loadChart = async () => {
  const labelSets: LabelSet[] = [{
    name: 'Studying English',
    labels: ['AS44HIQqRwzV6kCej2rE', 'vI2mPDqbYFafcq58DqVB'],
    dateSpanMap: {},
    dateSpans: []
  }, {
    name: 'Coding English',
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
  while (loopDate <= maxDate) {
    const formatDate = getFormatDate(loopDate)
    labelSets.forEach((labelSet) => {
      const dateSpan = labelSet.dateSpanMap[formatDate]
      labelSet.dateSpans.push(dateSpan ? [`${formatDate} 12`, dateSpan] : [])
    })
    loopDate.setDate(loopDate.getDate() + 1)
  }
  maxDate.setDate(maxDate.getDate() + 1)

  chartLegend.setOption({
    legend: {
      type: 'scroll',
      selectedMode: false
    },
    grid: {
      width: 0,
      height: 0
    },
    yAxis: {
    },
    xAxis: {
    },
    series: labelSets.map((labelSet) => {
      return {
        name: labelSet.name,
        type: 'bar'
      }
    })
  })

  chartGrid.resize({
    width: (getDaysDifference(maxDate, minDate) + 4) * 50,
  })
  chartGrid.setOption({
    grid: {
      left: 50,
      right: 0,
      top: 20,
      bottom: 20
    },
    yAxis: {
      type: 'value'
    },
    xAxis: {
      type: 'time',
      axisLabel: {
        formatter: '{MM}-{dd}'
      },
      minInterval: dayMills,
      maxInterval: dayMills,
      min: minDate.getTime(),
      max: maxDate.getTime(),
    },
    series: labelSets.map((labelSet) => {
      return {
        name: labelSet.name,
        type: 'bar',
        stack: 'span',
        barWidth: '80%',
        label: {
          show: true,
          formatter: '44.4%'
        },
        // label: {
        //   show: true,
        //   formatter: (params: any) => Math.round(params.value * 1000 / totalData[params.dataIndex]) / 10 + '%'
        // },
        data: labelSet.dateSpans
      }
    })
  })
}
</script>

<template>
  <div class="chart-legend" ref="legendDom"></div>
  <div class="grid-container">
    <div class="chart-grid" ref="gridDom"></div>
  </div>
</template>

<style scoped>
.chart-legend {
  min-width: 100dvw;
  height: 28px;
}

.grid-container {
  overflow: auto;
}

.chart-grid {
  height: 50dvh;
}
</style>