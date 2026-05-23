<template>
  <div
    class="group absolute overflow-hidden bg-gray-100 transition-all duration-300 dark:bg-[#242424]"
    :class="{
      'rounded-[12px] border dark:border-[#505050] ': config.border,
      'shadow-[0_3px_10px_1px_rgba(0,0,0,0.20)]': config.shadow && config.border,
    }"
  >
    <div
      class="size-full"
      :class="{
        'masonry-entry': shouldAnimateEntry,
        'masonry-entry-enter': shouldAnimateEntry && !hasEntered,
        'masonry-entry-entered': shouldAnimateEntry && hasEntered,
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
            v-show="!imageLoaded"
            class="masonry-placeholder absolute inset-0 overflow-hidden"
          >
            <div
              class="masonry-placeholder-blur absolute inset-0"
              :style="{
                background: placeholderBackground,
              }"
            />
            <div class="masonry-placeholder-shimmer absolute inset-0" />
          </div>
        </Transition>
        <img
          class="relative z-10 w-full cursor-pointer"
          :src="imageSrc"
          @load="handleImageLoaded"
          @click="store.viewImage(imageIndex)"
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
        @click="store.viewImage(imageIndex)"
      />
    </div>
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
  animateEntry: boolean
}>()

let timer: NodeJS.Timeout | null = null

const store = useStore()
const imageLoad = ref(false)
const imageLoaded = ref(false)
const hasEntered = ref(false)
const shouldAnimateEntry = ref(false)

const imageIdxStr = `${props.imageData.id * 100 + props.imageData.part}`

const imageSrc = computed(() =>
  imageLoad.value ? getImageUrl(props.imageData, ImageType.Thumbnail) : '',
)

const placeholderBackground = computed(() => {
  const baseColor = normalizeHexColor(props.imageData.dominant_color)
  const lightColor = mixHexColor(baseColor, '#ffffff', 0.38)
  const deepColor = mixHexColor(baseColor, '#000000', 0.22)

  return [
    `radial-gradient(circle at 24% 18%, ${lightColor} 0%, transparent 34%)`,
    `radial-gradient(circle at 76% 78%, ${deepColor} 0%, transparent 42%)`,
    `linear-gradient(135deg, ${baseColor} 0%, ${lightColor} 52%, ${deepColor} 100%)`,
  ].join(', ')
})

onMounted(() => {
  const hasLoaded = store.imagesLoaded.has(imageIdxStr)
  shouldAnimateEntry.value = props.animateEntry && !hasLoaded
  if (shouldAnimateEntry.value) {
    nextTick(() => {
      requestAnimationFrame(() => {
        hasEntered.value = true
      })
    })
  }

  if (hasLoaded) {
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
})

function handleImageLoaded() {
  imageLoaded.value = true
  store.imagesLoaded.add(imageIdxStr)
}

function normalizeHexColor(hex: string) {
  const value = hex.trim()
  const color = value.startsWith('#') ? value.slice(1) : value

  if (/^[\da-f]{3}$/i.test(color))
    return `#${color.split('').map(char => char + char).join('')}`

  if (/^[\da-f]{6}$/i.test(color))
    return `#${color}`

  return '#d1d5db'
}

function mixHexColor(hex: string, targetHex: string, weight: number) {
  const source = hexToRgb(hex)
  const target = hexToRgb(targetHex)

  return rgbToHex(
    Math.round(source.r + (target.r - source.r) * weight),
    Math.round(source.g + (target.g - source.g) * weight),
    Math.round(source.b + (target.b - source.b) * weight),
  )
}

function hexToRgb(hex: string) {
  const color = hex.replace('#', '')
  return {
    r: Number.parseInt(color.slice(0, 2), 16),
    g: Number.parseInt(color.slice(2, 4), 16),
    b: Number.parseInt(color.slice(4, 6), 16),
  }
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map(value => value.toString(16).padStart(2, '0')).join('')}`
}
</script>
