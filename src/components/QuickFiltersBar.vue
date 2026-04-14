<template>
  <div class="sticky top-[60px] z-[9] border-b bg-white/90 backdrop-blur dark:border-white/10 dark:bg-[#242424]/90">
    <div class="mx-auto max-w-[1200px] px-2 py-2">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
        <span>当前图片 {{ store.imagesFiltered.length }}</span>
        <span>当前作品 {{ store.filteredIllustCount }}</span>
        <span>{{ store.aiModeLabel }}</span>
        <span v-if="filterConfig.restrict.r18 !== 'hidden'">R18显示</span>
        <span v-if="store.dataMeta.updatedAt">数据更新 {{ formatTime(store.dataMeta.updatedAt) }}</span>
      </div>
      <div class="mt-2 flex gap-2 overflow-x-auto pb-1">
        <div class="flex shrink-0 items-center rounded-md border px-2 py-1 dark:border-white/20">
          <span class="mr-2 text-sm">AI生成作品</span>
          <Switch v-model="filterConfig.ai.enable" />
        </div>
        <div class="flex shrink-0 items-center rounded-md border px-2 py-1 dark:border-white/20">
          <span class="mr-2 text-sm">排序</span>
          <select
            v-model="masonryConfig.imageSortBy"
            class="rounded-md bg-transparent px-1 py-0.5 text-sm outline-none"
            @change="store.sortImages"
          >
            <option value="default">
              不排序
            </option>
            <option value="id_desc">
              ID降序
            </option>
            <option value="id_asc">
              ID升序
            </option>
            <option value="bookmark_desc">
              收藏数
            </option>
          </select>
        </div>
        <button
          v-for="bookmark in quickBookmarks"
          :key="bookmark"
          class="shrink-0 rounded-md border px-2 py-1 text-sm transition-colors hover:border-blue-500 dark:border-white/20 dark:hover:border-blue-500"
          :class="{
            '!border-blue-500 bg-blue-500/10 text-blue-500': isBookmarkActive(bookmark),
          }"
          @click="setBookmarkQuick(bookmark)"
        >
          {{ `${bookmark}+` }}
        </button>
        <button
          class="shrink-0 rounded-md border px-2 py-1 text-sm transition-colors hover:border-blue-500 dark:border-white/20 dark:hover:border-blue-500"
          :class="{
            '!border-blue-500 bg-blue-500/10 text-blue-500': !filterConfig.bookmark.enable,
          }"
          @click="clearBookmarkQuick"
        >
          全部
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStore } from '@/store'
import { formatTime } from '@/utils'

const store = useStore()
const { filterConfig, masonryConfig } = toRefs(store)

const quickBookmarks = [1000, 5000, 10000]

function setBookmarkQuick(bookmark: number) {
  filterConfig.value.bookmark.enable = true
  filterConfig.value.bookmark.min = bookmark
}

function clearBookmarkQuick() {
  filterConfig.value.bookmark.enable = false
  filterConfig.value.bookmark.min = 0
}

function isBookmarkActive(bookmark: number) {
  return filterConfig.value.bookmark.enable && filterConfig.value.bookmark.min === bookmark
}
</script>
