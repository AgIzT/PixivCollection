<template>
  <div class="mx-auto max-w-[1200px] px-2 pb-6">
    <div class="columns-2 gap-3 sm:columns-3 lg:columns-4 xl:columns-5">
      <div
        v-for="(height, index) in skeletonHeights"
        :key="index"
        class="mb-3 break-inside-avoid rounded-[12px] border bg-white p-2 dark:border-white/10 dark:bg-[#242424]"
      >
        <div
          class="animate-pulse rounded-[10px] bg-gray-200 dark:bg-[#303030]"
          :style="{
            height: `${height}px`,
          }"
        />
        <div class="space-y-2 px-1 py-3">
          <div class="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-[#303030]" />
          <div class="h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-[#303030]" />
          <div class="h-3 w-full animate-pulse rounded bg-gray-200 dark:bg-[#303030]" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const skeletonHeights = [220, 340, 260, 300, 240, 360, 280, 320, 260, 340]
</script>
