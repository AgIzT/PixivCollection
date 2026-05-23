<template>
  <div
    v-if="imageData && similarImages.length"
    class="fixed bottom-3 left-1/2 z-50 w-[calc(100%-1rem)] max-w-5xl -translate-x-1/2 text-white transition-all duration-300"
    :class="hidden ? 'pointer-events-none translate-y-[calc(100%+1rem)] opacity-0' : 'pointer-events-auto translate-y-0 opacity-100'"
    @mousedown.stop
    @touchstart.stop
    @wheel.stop
  >
    <div class="rounded-lg bg-black/45 p-2 shadow-2xl backdrop-blur-md">
      <div class="flex items-center justify-between px-1 pb-2 text-sm">
        <button
          class="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-white/10"
          @click="collapsed = !collapsed"
        >
          <IconRight
            class="size-3 transition-transform"
            :class="collapsed ? '' : 'rotate-90'"
          />
          相似图片
        </button>
        <span class="text-xs text-white/70">{{ similarImages.length }}</span>
      </div>
      <div
        v-show="!collapsed"
        class="flex gap-2 overflow-x-auto pb-1"
      >
        <button
          v-for="item in similarImages"
          :key="`${item.image.id}_${item.image.part}`"
          class="group relative h-24 w-16 shrink-0 overflow-hidden rounded-md bg-white/10 outline-none ring-white/70 transition-transform hover:-translate-y-0.5 focus-visible:ring-2 sm:h-28 sm:w-20"
          :title="item.image.title"
          @click="store.viewImage(item.index)"
        >
          <img
            class="size-full object-cover"
            :src="getImageUrl(item.image, ImageType.Thumbnail)"
          >
          <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1 pb-1 pt-5 text-left">
            <div class="truncate text-[11px] font-semibold leading-tight">
              {{ item.image.title }}
            </div>
            <div class="text-[10px] text-white/75">
              {{ item.sharedTagCount }} 标签<span v-if="item.sameAuthor"> + 作者</span>
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStore } from '@/store'
import { ImageType } from '@/types'
import { getImageUrl } from '@/utils'

const props = defineProps<{
  imageData: Image | null
  hidden: boolean
}>()

const store = useStore()
const collapsed = ref(false)

const similarImages = computed(() => store.getSimilarImages(props.imageData))
</script>
