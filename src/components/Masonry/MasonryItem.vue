<template>
  <div
    class="group absolute overflow-hidden bg-gray-100 transition-all duration-300 dark:bg-[#242424]"
    :class="{
      'rounded-[12px] border dark:border-[#505050] ': config.border,
      'shadow-[0_3px_10px_1px_rgba(0,0,0,0.20)]': config.shadow && config.border,
    }"
  >
    <div
      class="relative"
      :style="{
        height: `${imageHeight}px`,
      }"
    >
      <Transition name="fade-slow">
        <div
          v-show="!imageLoaded || imageError"
          class="absolute size-full"
          :style="{
            backgroundColor: imageData.dominant_color,
          }"
        />
      </Transition>
      <div
        v-if="imageError"
        class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/45 px-3 text-center text-sm text-white"
      >
        <span>图片加载失败</span>
        <button
          class="rounded-full bg-white/20 px-3 py-1 text-xs transition-colors hover:bg-white/30"
          @click.stop="retryImage"
        >
          点击重试
        </button>
      </div>
      <img
        v-show="!imageError"
        class="w-full cursor-pointer"
        :src="imageSrc"
        @load="handleImageLoaded"
        @error="handleImageError"
        @click="useStore().viewImage(imageIndex)"
      >
    </div>
    <Transition name="fade">
      <ImageInfo
        v-if="config.infoAtBottom"
        :image-data="imageData"
        :image-index="imageIndex"
        :config="config"
        mode="bottom"
      />
    </Transition>
    <div
      v-if="config.showAIBadge && imageData.aiGenerated"
      class="pointer-events-none absolute right-1 top-1 rounded-full bg-sky-200/90 px-2 py-0.5 text-xs font-semibold tracking-wide text-sky-900 shadow-sm"
    >
      AI生成
    </div>
    <div
      v-if="imageCount > 1"
      class="absolute right-1 flex items-center rounded-full bg-black/50 px-2 py-0.5 text-sm text-white"
      :class="config.showAIBadge && imageData.aiGenerated ? 'top-9' : 'top-1'"
    >
      <IconStack class="mr-1 size-3" />
      {{ imageCount }}
    </div>
    <ImageInfo
      v-if="!config.infoAtBottom"
      class="absolute top-0 size-full cursor-pointer bg-black/50 opacity-0 transition-all duration-300 group-hover:opacity-100"
      :image-data="imageData"
      :image-index="imageIndex"
      :config="config"
      mode="cover"
      @click="useStore().viewImage(imageIndex)"
    />
  </div>
</template>

<script setup lang="ts">
import {
  MASONRY_LOAD_DELAY,
} from '@/config'
import { useStore } from '@/store'
import { ImageType } from '@/types'
import { getImageUrl } from '@/utils'

const props = defineProps<{
  imageData: Image
  imageIndex: number
  imageHeight: number
  imageCount: number
  config: MasonryItemConfig
}>()

let timer: NodeJS.Timeout | null = null
let retryTimer: NodeJS.Timeout | null = null

const MAX_AUTO_RETRIES = 2
const AUTO_RETRY_DELAY = 500

const imageLoad = ref(false)
const imageLoaded = ref(false)
const imageError = ref(false)
const imageRetry = ref(0)
const autoRetryCount = ref(0)

const imageIdxStr = `${props.imageData.id * 100 + props.imageData.part}`

const imageSrc = computed(() =>
  imageLoad.value
    ? `${getImageUrl(props.imageData, ImageType.Thumbnail)}${imageRetry.value ? `?retry=${imageRetry.value}` : ''}`
    : '',
)

onMounted(() => {
  if (useStore().imagesLoaded.has(imageIdxStr)) {
    imageLoad.value = true
    return
  }
  timer = setTimeout(() => {
    imageLoad.value = true
    timer = null
  }, MASONRY_LOAD_DELAY)
})

onUnmounted(() => {
  if (timer)
    clearTimeout(timer)
  if (retryTimer)
    clearTimeout(retryTimer)
})

function handleImageLoaded() {
  imageError.value = false
  imageLoaded.value = true
  autoRetryCount.value = 0
  useStore().imagesLoaded.add(imageIdxStr)
}

function handleImageError() {
  imageLoaded.value = false
  if (autoRetryCount.value < MAX_AUTO_RETRIES) {
    if (retryTimer)
      clearTimeout(retryTimer)
    retryTimer = setTimeout(() => {
      autoRetryCount.value += 1
      imageRetry.value += 1
      retryTimer = null
    }, AUTO_RETRY_DELAY)
    return
  }
  imageError.value = true
}

function retryImage() {
  imageError.value = false
  imageLoaded.value = false
  autoRetryCount.value = 0
  if (retryTimer)
    clearTimeout(retryTimer)
  imageRetry.value += 1
}
</script>
