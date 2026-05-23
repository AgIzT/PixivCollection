<template>
  <Transition name="fade">
    <div
      v-show="showStats"
      class="fixed inset-0 z-40 bg-white/95 text-gray-900 backdrop-blur-md dark:bg-[#1a1a1a]/95 dark:text-white"
      @click.self="store.showStats = false"
    >
      <div
        ref="panelRef"
        class="h-screen px-4 py-5 sm:px-6 lg:px-8"
        data-overlayscrollbars-initialize
      >
        <div class="mx-auto max-w-7xl">
          <div class="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold">
                统计数据
              </h2>
              <p class="text-sm text-gray-500 dark:text-white/60">
                {{ imagesFiltered.length }} 张图片
              </p>
            </div>
            <button
              class="grid size-11 place-items-center rounded-full border border-black/10 transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              title="关闭统计面板"
              @click="store.showStats = false"
            >
              <IconClose class="size-5" />
            </button>
          </div>

          <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section class="stats-chart-section lg:col-span-2">
              <div class="stats-chart-head">
                <h3>收藏时间线</h3>
                <span>{{ timelineData.labels.length }} 月</span>
              </div>
              <div class="stats-chart-tall">
                <canvas ref="timelineCanvas" />
              </div>
            </section>

            <section class="stats-chart-section">
              <div class="stats-chart-head">
                <h3>Top 作者</h3>
                <span>{{ topAuthorsData.labels.length }}</span>
              </div>
              <div class="stats-chart-medium">
                <canvas ref="authorsCanvas" />
              </div>
            </section>

            <section class="stats-chart-section">
              <div class="stats-chart-head">
                <h3>Top 标签</h3>
                <span>{{ topTagsData.labels.length }}</span>
              </div>
              <div class="stats-chart-medium">
                <canvas ref="tagsCanvas" />
              </div>
            </section>

            <section class="stats-chart-section">
              <div class="stats-chart-head">
                <h3>收藏数分布</h3>
                <span>{{ imagesFiltered.length }}</span>
              </div>
              <div class="stats-chart-medium">
                <canvas ref="bookmarkCanvas" />
              </div>
            </section>

            <section class="stats-chart-section">
              <div class="stats-chart-head">
                <h3>图片尺寸散点</h3>
                <span>{{ dimensionScatterData.total }}</span>
              </div>
              <div class="stats-chart-medium">
                <canvas ref="dimensionCanvas" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  ScatterController,
  Tooltip,
} from 'chart.js'
import type { ChartConfiguration, ChartType } from 'chart.js'
import { OverlayScrollbars } from 'overlayscrollbars'
import { useStore } from '@/store'
import { isGenericTag } from '@/utils'

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  ScatterController,
  Tooltip,
)

const store = useStore()
const { colorScheme, imagesFiltered, scrollbarTheme, showStats } = toRefs(store)

const panelRef = ref<HTMLDivElement | null>(null)
const timelineCanvas = ref<HTMLCanvasElement | null>(null)
const authorsCanvas = ref<HTMLCanvasElement | null>(null)
const tagsCanvas = ref<HTMLCanvasElement | null>(null)
const bookmarkCanvas = ref<HTMLCanvasElement | null>(null)
const dimensionCanvas = ref<HTMLCanvasElement | null>(null)

const chartMap = new Map<string, { destroy: () => void }>()
let osInstance: OverlayScrollbars | null = null

const timelineData = computed(() => {
  const counts = new Map<string, number>()
  imagesFiltered.value.forEach((image) => {
    const month = image.created_at.slice(0, 7)
    if (!/^\d{4}-\d{2}$/.test(month))
      return
    counts.set(month, (counts.get(month) || 0) + 1)
  })

  const labels = Array.from(counts.keys()).sort()
  return {
    labels,
    values: labels.map(label => counts.get(label) || 0),
  }
})

const topAuthorsData = computed(() => {
  const counts = new Map<number, { label: string, count: number }>()
  imagesFiltered.value.forEach((image) => {
    const current = counts.get(image.author.id)
    if (current) {
      current.count++
    }
    else {
      counts.set(image.author.id, {
        label: image.author.name || String(image.author.id),
        count: 1,
      })
    }
  })

  const rows = Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)

  return {
    labels: rows.map(row => row.label),
    values: rows.map(row => row.count),
  }
})

const topTagsData = computed(() => {
  const counts = new Map<string, { label: string, count: number }>()
  imagesFiltered.value.forEach((image) => {
    image.tags.forEach((tag) => {
      if (isGenericTag(tag))
        return

      const current = counts.get(tag.name)
      if (current) {
        current.count++
      }
      else {
        counts.set(tag.name, {
          label: tag.translated_name || tag.name,
          count: 1,
        })
      }
    })
  })

  const rows = Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  return {
    labels: rows.map(row => row.label),
    values: rows.map(row => row.count),
  }
})

const bookmarkDistributionData = computed(() => {
  const buckets = [
    { label: '0-100', min: 0, max: 100 },
    { label: '100-500', min: 100, max: 500 },
    { label: '500-1K', min: 500, max: 1000 },
    { label: '1K-5K', min: 1000, max: 5000 },
    { label: '5K-10K', min: 5000, max: 10000 },
    { label: '10K-50K', min: 10000, max: 50000 },
    { label: '50K-100K', min: 50000, max: 100000 },
    { label: '100K+', min: 100000, max: Infinity },
  ]
  const values = Array.from({ length: buckets.length }).fill(0) as number[]

  imagesFiltered.value.forEach((image) => {
    const value = Math.max(0, image.bookmark)
    const index = buckets.findIndex(bucket => value >= bucket.min && value < bucket.max)
    if (index >= 0)
      values[index]++
  })

  return {
    labels: buckets.map(bucket => bucket.label),
    values,
  }
})

const dimensionScatterData = computed(() => {
  const horizontal: { x: number, y: number }[] = []
  const vertical: { x: number, y: number }[] = []
  const square: { x: number, y: number }[] = []

  imagesFiltered.value.forEach((image) => {
    const point = { x: image.size[0], y: image.size[1] }
    const ratio = image.size[0] / image.size[1]
    if (ratio > 1.1)
      horizontal.push(point)
    else if (ratio < 0.9)
      vertical.push(point)
    else
      square.push(point)
  })

  return {
    horizontal,
    vertical,
    square,
    total: imagesFiltered.value.length,
  }
})

const chartTheme = computed(() => {
  const dark = colorScheme.value === 'dark'
  return {
    axis: dark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(31, 41, 55, 0.72)',
    grid: dark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(31, 41, 55, 0.10)',
    text: dark ? 'rgba(255, 255, 255, 0.82)' : 'rgba(31, 41, 55, 0.90)',
  }
})

watch(showStats, (visible) => {
  if (visible) {
    nextTick(() => {
      initScrollbar()
      renderCharts()
    })
  }
})

watch([imagesFiltered, chartTheme], () => {
  if (!showStats.value)
    return

  nextTick(renderCharts)
})

watch(scrollbarTheme, (newScheme) => {
  osInstance?.options({ scrollbars: { theme: newScheme } })
}, { immediate: true })

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  destroyCharts()
  osInstance?.destroy()
})

function initScrollbar() {
  if (!panelRef.value || osInstance)
    return

  osInstance = OverlayScrollbars(panelRef.value, {
    scrollbars: {
      autoHide: 'move',
    },
  })
  osInstance.options({ scrollbars: { theme: scrollbarTheme.value } })
}

function renderCharts() {
  renderTimelineChart()
  renderAuthorsChart()
  renderTagsChart()
  renderBookmarkChart()
  renderDimensionChart()
}

function renderTimelineChart() {
  const theme = chartTheme.value
  createChart('timeline', timelineCanvas.value, {
    type: 'line',
    data: {
      labels: timelineData.value.labels,
      datasets: [{
        label: '图片数',
        data: timelineData.value.values,
        borderColor: '#0398fa',
        backgroundColor: 'rgba(3, 152, 250, 0.18)',
        fill: true,
        pointRadius: 2,
        tension: 0.35,
      }],
    },
    options: baseOptions(theme),
  })
}

function renderAuthorsChart() {
  const theme = chartTheme.value
  createChart('authors', authorsCanvas.value, {
    type: 'bar',
    data: {
      labels: topAuthorsData.value.labels,
      datasets: [{
        label: '图片数',
        data: topAuthorsData.value.values,
        backgroundColor: '#409eff',
        borderRadius: 4,
      }],
    },
    options: {
      ...baseOptions(theme),
      indexAxis: 'y',
    },
  })
}

function renderTagsChart() {
  const theme = chartTheme.value
  createChart('tags', tagsCanvas.value, {
    type: 'bar',
    data: {
      labels: topTagsData.value.labels,
      datasets: [{
        label: '出现次数',
        data: topTagsData.value.values,
        backgroundColor: '#22c55e',
        borderRadius: 4,
      }],
    },
    options: {
      ...baseOptions(theme),
      indexAxis: 'y',
    },
  })
}

function renderBookmarkChart() {
  const theme = chartTheme.value
  createChart('bookmarks', bookmarkCanvas.value, {
    type: 'bar',
    data: {
      labels: bookmarkDistributionData.value.labels,
      datasets: [{
        label: '图片数',
        data: bookmarkDistributionData.value.values,
        backgroundColor: '#f59e0b',
        borderRadius: 4,
      }],
    },
    options: baseOptions(theme),
  })
}

function renderDimensionChart() {
  const theme = chartTheme.value
  createChart('dimensions', dimensionCanvas.value, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: '横向',
          data: dimensionScatterData.value.horizontal,
          backgroundColor: '#0398fa',
          pointRadius: 3,
        },
        {
          label: '竖向',
          data: dimensionScatterData.value.vertical,
          backgroundColor: '#f06292',
          pointRadius: 3,
        },
        {
          label: '方形',
          data: dimensionScatterData.value.square,
          backgroundColor: '#22c55e',
          pointRadius: 3,
        },
      ],
    },
    options: {
      ...baseOptions(theme),
      scales: {
        x: {
          title: { display: true, text: '宽度', color: theme.text },
          ticks: { color: theme.axis },
          grid: { color: theme.grid },
        },
        y: {
          title: { display: true, text: '高度', color: theme.text },
          ticks: { color: theme.axis },
          grid: { color: theme.grid },
        },
      },
    },
  })
}

function createChart<T extends ChartType>(key: string, canvas: HTMLCanvasElement | null, config: ChartConfiguration<T>) {
  if (!canvas)
    return

  chartMap.get(key)?.destroy()
  chartMap.set(key, new Chart(canvas, config))
}

function baseOptions(theme: { axis: string, grid: string, text: string }) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: theme.text,
          boxWidth: 12,
        },
      },
      tooltip: {
        intersect: false,
        mode: 'index' as const,
      },
    },
    scales: {
      x: {
        ticks: {
          color: theme.axis,
          maxRotation: 0,
          autoSkip: true,
        },
        grid: {
          color: theme.grid,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: theme.axis,
          precision: 0,
        },
        grid: {
          color: theme.grid,
        },
      },
    },
  }
}

function destroyCharts() {
  chartMap.forEach(chart => chart.destroy())
  chartMap.clear()
}

function handleKeydown(e: KeyboardEvent) {
  if (!showStats.value || e.key !== 'Escape')
    return

  store.showStats = false
}
</script>

<style>
.stats-chart-section {
  min-width: 0;
  border: 1px solid rgb(0 0 0 / 8%);
  border-radius: 8px;
  background: rgb(255 255 255 / 82%);
  padding: 12px;
}

.dark .stats-chart-section {
  border-color: rgb(255 255 255 / 12%);
  background: rgb(36 36 36 / 82%);
}

.stats-chart-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 2px 2px 10px;
}

.stats-chart-head h3 {
  font-size: 15px;
  font-weight: 600;
}

.stats-chart-head span {
  color: rgb(107 114 128);
  font-size: 12px;
}

.dark .stats-chart-head span {
  color: rgb(255 255 255 / 55%);
}

.stats-chart-tall {
  height: 300px;
}

.stats-chart-medium {
  height: 320px;
}

@media (max-width: 640px) {
  .stats-chart-tall,
  .stats-chart-medium {
    height: 280px;
  }
}
</style>
