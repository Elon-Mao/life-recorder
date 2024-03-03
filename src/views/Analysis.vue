<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
// import {
//   doc,
//   query,
//   setDoc,
//   deleteDoc,
//   onSnapshot,
//   where,
//   Unsubscribe,
//   getDocs
// } from 'firebase/firestore'
// import { useUserStore } from '@/stores/user'
// import { useLabelStore } from '@/stores/label'

// const userStore = useUserStore()
// const labelStore = useLabelStore()
// const recordCollection = userStore.getRecordsCollection()

const chartDom = ref(null)
let myChart: echarts.EChartsType
let minWidth = 0
onMounted(() => {
  myChart = echarts.init(chartDom.value)
  minWidth = myChart.getWidth()
  loadChart()
})

const loadChart = async () => {
  // const labelSets = [{
  //   name: 'Studying English',
  //   labels: ['AS44HIQqRwzV6kCej2rE', 'vI2mPDqbYFafcq58DqVB']
  // }, {
  //   name: 'Coding English',
  //   labels: ['sONqEVfWPxMMpkfRk6dw', 'EvMZueaN14DkvKe4fZBn', 'mzhn1hVEPTSatWdyCy2f', 'LKUwkiPELOgdpYWYlCgq']
  // }]
  // for (const labelSet of labelSets) {
  //   for (const labelId of labelSet.labels) {
  //       await getDocs(query(recordCollection, where('labelId', '==', labelId)))
  //   }
  // }

  // There should not be negative values in rawData
  // const rawData = [
  //   [100, 302, 301, 334, 390, 330, 320, 20, 20],
  //   [320, 132, 101, 134, 90, 230, 210, 20, 20],
  //   [220, 182, 191, 234, 290, 330, 310, 20, 20],
  //   [50, 2, 1, 54, 90, 30, 10, 20, 20],
  //   [20, 32, 1, 34, 90, 30, 20, 20, 20]
  // ]
  // const totalData: number[] = []
  // for (let i = 0; i < rawData[0].length; ++i) {
  //   let sum = 0
  //   for (let j = 0; j < rawData.length; ++j) {
  //     sum += rawData[j][i]
  //   }
  //   totalData.push(sum)
  // }
  const rawData = [
    [['2024-02-28 12:00', 100], ['2024-02-27 12:00', 100], ['2024-02-26 12:00', 100], ['2024-02-25 12:00', 100]
    , ['2024-02-24 12:00', 100], ['2024-02-23 12:00', 100], ['2024-02-22 12:00', 100], ['2024-02-20 12:00', 100]
    , ['2024-02-19 12:00', 100], ['2024-02-18 12:00', 100], ['2024-02-17 12:00', 100], ['2024-02-16 12:00', 100]]
  ]

  const series: echarts.BarSeriesOption[] = [
    'Direct',
    // 'Mail Ad',
    // 'Affiliate Ad',
    // 'Video Ad',
    // 'Search Engine'
  ].map((name, sid) => {
    return {
      name,
      type: 'bar',
      stack: 'total',
      barWidth: '80%',
      label: {
        show: true,
        formatter: '44.4%'
      },
      // label: {
      //   show: true,
      //   formatter: (params: any) => Math.round(params.value * 1000 / totalData[params.dataIndex]) / 10 + '%'
      // },
      data: rawData[sid]
    }
  })

  myChart.resize({
    width: Math.max(minWidth, 16 * 50),
  })
  myChart.setOption({
    legend: {
      type: 'scroll'
    },
    grid: {
      left: 50,
      right: 0,
      top: 50,
      bottom: 50
    },
    yAxis: {
      type: 'value'
    },
    xAxis: {
      type: 'time',
      axisLabel: {
        formatter: '{MM}-{dd}'
      },
      minInterval: 3600 * 24 * 1000,
      maxInterval: 3600 * 24 * 1000,
      min: new Date('2024-02-15'),
      max: new Date('2024-02-29')
      // data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Sun', 'Sun']
    },
    series,
  })
}
</script>

<template>
  <div class="chart-container">
    <div class="analysis-chart" ref="chartDom"></div>
  </div>
</template>

<style scoped>
.chart-container {
  overflow: auto;
}

.analysis-chart {
  min-width: 100dvw;
  height: 50dvh;
}
</style>
