<template>
    <!-- The card is as tall as its table and stops at the space the page has left (max-height + flex shrink in
         workspace.scss), then the q-scroll-area scrolls. The table virtual-scrolls inside the scroll area through
         virtual-scroll-target, so it keeps its own .q-table__middle unscrolled and the sticky header works.
         The table renders at once (the target arrives after mount and QVirtualScroll follows it), and the height
         is measured without debounce: a 0 px card for one frame is what made the tab switch flicker. -->
    <div class="kn-ws-table-frame" :style="{ height: contentHeight ? contentHeight + 'px' : undefined }" data-ws="list">
        <q-scroll-area ref="scrollArea" class="fit" :thumb-style="thumbStyle">
            <div class="kn-ws-table-frame__content">
                <!-- first load: the header and rows shaped like the real ones (QSkeleton) -->
                <q-markup-table v-if="skeleton" flat dense class="kn-ws-table kn-ws-table--skeleton" data-ws="skeleton" aria-busy="true">
                    <thead>
                        <tr>
                            <th v-for="column in columns" :key="column.name" :class="['text-' + (column.align ?? 'left'), { 'kn-ws-skeleton-narrow': !column.label }]">{{ column.label }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in SKELETON_ROWS" :key="row">
                            <td v-for="(column, index) in columns" :key="column.name">
                                <div v-if="column.name === nameColumn" class="row items-center no-wrap kn-ws-name">
                                    <q-skeleton type="rect" class="kn-ws-skeleton-icon" animation="wave" />
                                    <div class="column no-wrap kn-ws-skeleton-lines">
                                        <q-skeleton type="text" :width="widthFor(row, index, 45, 75) + '%'" animation="wave" />
                                        <q-skeleton type="text" :width="widthFor(row, index + 3, 25, 45) + '%'" class="kn-ws-skeleton-sub" animation="wave" />
                                    </div>
                                </div>
                                <q-skeleton v-else-if="column.label" type="text" :width="widthFor(row, index, 35, 80) + '%'" animation="wave" />
                            </td>
                        </tr>
                    </tbody>
                </q-markup-table>
                <slot v-else :scroll-target="scrollTarget" />
                <q-resize-observer :debounce="0" @resize="onResize" />
            </div>
        </q-scroll-area>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { QScrollArea } from 'quasar'

const SKELETON_ROWS = 6

withDefaults(defineProps<{ skeleton?: boolean; columns?: { name: string; label: string; align?: string }[]; nameColumn?: string }>(), { skeleton: false, columns: () => [], nameColumn: 'name' })

const scrollArea = ref<QScrollArea | null>(null)
const scrollTarget = ref<Element | undefined>(undefined)
const contentHeight = ref(0)

// thin, quiet thumb (the scroll area default is 5px and dark)
const thumbStyle = { width: '6px', right: '2px', borderRadius: '3px', opacity: '0.45' }

// The frame border (1px top + 1px bottom) is outside the content. A hidden tab (keep-alive detaches its DOM)
// reports 0: keep the last height, or the tab comes back as a 2 px card for a frame.
const onResize = (size: { height: number }) => {
    if (size.height > 0) contentHeight.value = Math.ceil(size.height) + 2
}

// stable, varied bar widths (no random: the skeleton does not jump between renders)
const widthFor = (row: number, column: number, min: number, max: number) => min + (((row * 37 + column * 53) % 100) / 100) * (max - min)

onMounted(() => {
    scrollTarget.value = scrollArea.value?.getScrollTarget() ?? undefined
})
</script>
