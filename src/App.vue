<template>
  <div
    :class="{
      dark: colorScheme === 'dark',
    }"
  >
    <div class="min-h-screen transition-colors dark:bg-[#1a1a1a] dark:text-white">
      <Sidebar />
      <SidebarMask />
      <Navbar />
      <QuickFiltersBar />
      <MasonryView v-if="loadState === 'ready' && imagesFiltered.length" />
      <div v-if="loadState === 'loading'" class="pb-4">
        <Tip>
          <div class="text-center">
            正在加载作品数据
            <div class="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {{ formatBytes(receivedLength) }}<span v-if="contentLength"> / {{ formatBytes(contentLength) }}</span>
            </div>
          </div>
        </Tip>
        <LoadingSkeleton />
      </div>
      <Tip v-else-if="loadState === 'error'">
        <div class="text-center">
          {{ loadErrorMessage || '元数据加载失败，请检查网络或数据文件后重试。' }}
          <div class="mt-3">
            <CButton @click="loadData">
              点击重试
            </CButton>
          </div>
        </div>
      </Tip>
      <Tip v-else-if="loadState === 'empty'">
        当前数据源没有可展示的作品数据
      </Tip>
      <Tip v-else-if="loadState === 'ready' && images.length && !imagesFiltered.length">
        当前筛选条件下没有结果
      </Tip>
      <ImageViewer />
      <DebugInfo v-if="debug.enable" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { SettingType } from '@orilight/vue-settings'
import { useThrottleFn } from '@vueuse/core'
import {
  ClickScrollPlugin,
  OverlayScrollbars,
  SizeObserverPlugin,
} from 'overlayscrollbars'
import { DATA_FILE, ONLINE_MODE } from '@/config'
import { useStore } from '@/store'
import { formatBytes, normalizeImages } from '@/utils'

const store = useStore()

const {
  preferColorScheme,
  colorScheme,
  scrollbarTheme,
  loadState,
  loadErrorMessage,
  images,
  imagesFiltered,
  masonryConfig,
  filterConfig,
  imageViewer,
  debug,
  showSidebar,
  viewState,
} = toRefs(store)

const receivedLength = ref(0)
const contentLength = ref(0)
const scrollRestored = ref(false)
const DATA_FETCH_TIMEOUT = 30000

let osInstance: OverlayScrollbars | null = null

const updateScrollTop = useThrottleFn(() => {
  viewState.value.scrollTop = document.documentElement.scrollTop
}, 200)

watch(() => [imageViewer.value.show, showSidebar.value], (show) => {
  if (show.some(i => i)) {
    osInstance?.options({ overflow: { y: 'hidden' }, scrollbars: { visibility: 'hidden' } })
  }
  else {
    osInstance?.options({ overflow: { y: 'scroll' }, scrollbars: { visibility: 'auto' } })
  }
})

watch(scrollbarTheme, (newScheme) => {
  osInstance?.options({ scrollbars: { theme: newScheme } })
}, { immediate: true })

watch(loadState, (state) => {
  if (state === 'ready')
    restoreScrollPosition()
})

function regSettings() {
  store.settings.register('preferColorScheme', preferColorScheme)
  store.settings.register('masonryConfig', masonryConfig, SettingType.Json, {
    deepMerge: true,
  })
  store.settings.register('filterYearConfig', toRef(filterConfig.value, 'year'), SettingType.Json, {
    deepMerge: true,
  })
  store.settings.register('filterShapeConfig', toRef(filterConfig.value, 'shape'), SettingType.Json, {
    deepMerge: true,
  })
  store.settings.register('filterSizeConfig', toRef(filterConfig.value, 'size'), SettingType.Json, {
    deepMerge: true,
  })
  store.settings.register('filterBookmarkConfig', toRef(filterConfig.value, 'bookmark'), SettingType.Json, {
    deepMerge: true,
  })
  store.settings.register('filterAuthorConfig', toRef(filterConfig.value, 'author'), SettingType.Json, {
    deepMerge: true,
  })
  store.settings.register('filterTagConfig', toRef(filterConfig.value, 'tag'), SettingType.Json, {
    deepMerge: true,
  })
  store.settings.register('filterAIConfig', toRef(filterConfig.value, 'ai'), SettingType.Json, {
    deepMerge: true,
  })
  store.settings.register('filterRestrictConfig', toRef(filterConfig.value, 'restrict'), SettingType.Json, {
    deepMerge: true,
  })
  store.settings.register('showSidebar', showSidebar)
  store.settings.register('viewState', viewState, SettingType.Json, {
    deepMerge: true,
  })
}

async function fetchData() {
  store.loadState = 'loading'
  store.loadErrorType = null
  store.loadErrorMessage = ''
  receivedLength.value = 0
  contentLength.value = 0

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), DATA_FETCH_TIMEOUT)

  try {
    const response = await fetch(DATA_FILE, {
      signal: controller.signal,
    })
    if (!response.ok)
      throw new Error(`Request failed with ${response.status}`)

    const updatedAt = response.headers.get('Last-Modified') || response.headers.get('Date') || ''
    contentLength.value = +(response.headers.get('Content-Length') || 0)

    const result = await response.text()
    updateReceivedLength(result)

    store.applyLoadedImages(normalizeImages(JSON.parse(result)), updatedAt)
  }
  catch (e) {
    console.error(e)
    store.setLoadError('metadata', '元数据加载失败，请检查网络或数据文件后重试。')
  }
  finally {
    window.clearTimeout(timeoutId)
  }
}

function updateReceivedLength(text: string) {
  receivedLength.value = new TextEncoder().encode(text).length
  if (!contentLength.value)
    contentLength.value = receivedLength.value
}

async function loadData() {
  scrollRestored.value = false
  if (ONLINE_MODE)
    await store.fetchFromAPI(true)
  else
    await fetchData()
}

function restoreScrollPosition() {
  if (scrollRestored.value || viewState.value.scrollTop <= 0)
    return
  nextTick(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: viewState.value.scrollTop, behavior: 'auto' })
      scrollRestored.value = true
    })
  })
}

onMounted(() => {
  OverlayScrollbars.plugin([SizeObserverPlugin, ClickScrollPlugin])
  osInstance = OverlayScrollbars(document.body, {
    scrollbars: {
      autoHide: 'move',
      clickScroll: true,
      autoHideSuspend: true,
    },
  })
  regSettings()
  window.addEventListener('scroll', updateScrollTop, { passive: true })
  loadData()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateScrollTop)
  store.settings.unregisterAll()
  osInstance?.destroy()
})
</script>

<style>
body {
  overflow-y: scroll;
}
</style>
