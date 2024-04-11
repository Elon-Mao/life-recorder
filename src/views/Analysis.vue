<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  RadioGroup as VanRadioGroup,
  Radio as VanRadio
} from 'vant'
import * as echarts from 'echarts'
import { useLabelStore } from '@/stores/label'
import { useRecordStore } from '@/stores/recordData'
import { calculateSpan } from '@/common/convertToRecord'
import RecordForm from '@/types/RecordForm'
import { dayMills, getFormatDate } from '@/common/dateTools'
import { CallbackDataParams } from 'echarts/types/dist/shared.js'

const route = useRoute()
const labelStore = useLabelStore()
const recordStore = useRecordStore()

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

interface DateRecordGroup {
  date: string
  records: RecordForm[]
}

const loadMultiChart = () => {
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
      const records = recordStore.listBylabelId(labelId)
      for (const record of records) {
        const recordForm = { ...record } as RecordForm
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
      }
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

const getRecords = (labelId: string) => {
  const minDate = new Date()
  minDate.setDate(minDate.getDate() - 7)
  let minDateStr = getFormatDate(minDate)
  const records = recordStore.listBylabelId(labelId).map((record) => {
    const recordForm = { ...record } as RecordForm
    recordForm.startTimeParts = recordForm.startTime!.split(':')
    recordForm.endTimeParts = recordForm.endTime!.split(':')
    calculateSpan(recordForm)
    const date = recordForm.date!
    if (date < minDateStr) {
      minDateStr = date
    }
    return recordForm
  })
  const maxDate = new Date()
  const dateRecordGroups = []
  for (let date = new Date(minDateStr); date <= maxDate; date.setDate(date.getDate() + 1)) {
    const dateString = getFormatDate(date)
    const recordGroup = []
    for (let i = records.length - 1; i >= 0; i--) {
      if (records[i].date === dateString) {
        recordGroup.push(records.splice(i, 1)[0])
      }
    }
    dateRecordGroups.push({ date: dateString, records: recordGroup })
  }
  return dateRecordGroups
}

const chartOption: echarts.EChartsOption = {
  dataZoom: {
    type: 'inside',
    zoomLock: true,
    filterMode: 'none',
  },
  legend: {
    selectedMode: false
  },
  grid: {
    left: 45,
    bottom: 25,
  },
}

const onOptionsChange = () => {
  let seriesGroups = labelRecordGroups
  switch (timeCycle.value) {
    case 7: {
      seriesGroups = []
      if (!labelRecordGroups.length) {
        break
      }
      const minDate = new Date(labelRecordGroups[0].date)
      let index = minDate.getDay() - 1
      if (index) {
        const lastMonday = new Date(minDate)
        lastMonday.setDate(minDate.getDate() - index)
        const group: DateRecordGroup = {
          date: getFormatDate(lastMonday),
          records: []
        }
        for (let i = 0; i < 7 - index; i++) {
          if (i > labelRecordGroups.length - 1) {
            break
          }
          group.records.push(...labelRecordGroups[i].records)
        }
        seriesGroups.push(group)
        index = 7 - index
      }
      while (index < labelRecordGroups.length) {
        const group: DateRecordGroup = {
          date: labelRecordGroups[index].date,
          records: []
        }
        for (let i = 0; i < 7; i++, index++) {
          if (index > labelRecordGroups.length - 1) {
            break
          }
          group.records.push(...labelRecordGroups[index].records)
        }
        seriesGroups.push(group)
      }
      break
    }
    case 30: {
      seriesGroups = []
      if (!labelRecordGroups.length) {
        break
      }
      let monthGroup: DateRecordGroup = {
        date: labelRecordGroups[0].date.slice(0, 7),
        records: []
      }
      seriesGroups.push(monthGroup)
      for (const recordGroup of labelRecordGroups) {
        const date = recordGroup.date.slice(0, 7)
        if (date !== monthGroup.date) {
          monthGroup = {
            date,
            records: []
          }
          seriesGroups.push(monthGroup)
        }
        monthGroup.records.push(...recordGroup.records)
      }
      break
    }
  }
  switch (chartType.value) {
    case '1': {
      const xData = seriesGroups.map((dateRecordGroup) => dateRecordGroup.date)
      chartOption.xAxis = {
        type: 'category',
        data: xData
      }
      chartOption.dataZoom = {
        ...chartOption.dataZoom,
        startValue: Math.max(0, xData.length - 7),
        endValue: xData.length - 1
      }
      chartOption.yAxis = {
        type: 'value',
        name: 'minutes',
      }
      chartOption.series = {
        name: labelName,
        type: 'bar',
        barWidth: '80%',
        data: seriesGroups.map((recordGroup) => {
          return recordGroup.records.reduce((sumSpan, record) => sumSpan + record.span!, 0)
        })
      }
      break
    }
    case '2':
      chartOption.xAxis = {
        type: 'category',
        data: labelRecordGroups.map((dateRecordGroup) => dateRecordGroup.date)
      }
      chartOption.dataZoom = {
        ...chartOption.dataZoom,
        startValue: Math.max(0, labelRecordGroups.length - 7 * timeCycle.value),
        endValue: labelRecordGroups.length - 1
      }
      chartOption.yAxis = {
        type: 'time',
      }
      chartOption.series = {
        name: labelName,
        type: 'scatter',
        data: seriesGroups.reduce((allRecords: [string, Date][], seriesGroup) => {
          return allRecords.concat(seriesGroup.records.map((record) => [record.date!, new Date('1970/01/01 ' + record.startTime)]))
        }, [])
      }
      break
    case '3': {
      const xData = seriesGroups.map((dateRecordGroup) => dateRecordGroup.date)
      chartOption.xAxis = {
        type: 'category',
        data: xData
      }
      chartOption.dataZoom = {
        ...chartOption.dataZoom,
        startValue: Math.max(0, xData.length - 7),
        endValue: xData.length - 1
      }
      chartOption.yAxis = {
        type: 'value',
        minInterval: 1,
        name: 'times',
      }
      chartOption.series = {
        name: labelName,
        type: 'bar',
        barWidth: '80%',
        data: seriesGroups.map((recordGroup) => recordGroup.records.length)
      }
      break
    }
  }
  chartGrid.clear()
  chartGrid.setOption(chartOption)
}

const loadSingleChart = async () => {
  const labelId = route.query.labelId as string
  labelRecordGroups = await getRecords(labelId)
  labelName = labelStore.entityMap[labelId].labelName!
  onOptionsChange()
}

const chartType = ref('1')
let labelRecordGroups: DateRecordGroup[] = []
let labelName = ''
const timeCycle = ref(1)
</script>

<template>
  <div class="chart-container">
    <div class="chart-grid" ref="gridDom"></div>
    <van-radio-group class="chart-radio-group" v-model="timeCycle" direction="horizontal" :onChange="onOptionsChange">
      <van-radio :name=1>Daily</van-radio>
      <van-radio :name=7>Weekly</van-radio>
      <van-radio :name=30>Monthly</van-radio>
    </van-radio-group>
    <van-radio-group class="chart-radio-group" v-model="chartType" direction="horizontal" :onChange="onOptionsChange">
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

.chart-radio-group {
  width: 100%;
  box-sizing: border-box;
  padding: 5px;
}

.chart-radio-group>* {
  margin: 0;
  flex: 1;
}
</style>