<template>
    <div class="widget-picker-layer">
        <!-- Dims the dashboard; the main menu stays above it. A click on it closes the panel (outside click). -->
        <div class="widget-picker-layer__backdrop" data-test="widget-picker-backdrop"></div>
        <div ref="panelRef" class="widget-picker column no-wrap">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ $t('dashboard.widgetEditor.addWidget') }}</q-toolbar-title>
                <q-btn flat round dense icon="close" data-test="close-button" @click="close">
                    <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.close') }}</q-tooltip>
                </q-btn>
            </q-toolbar>

            <div class="q-pa-sm">
                <q-input v-model="searchText" outlined dense clearable autofocus hide-bottom-space :placeholder="$t('dashboard.widgetPicker.search')" data-test="search-input">
                    <template #prepend>
                        <q-icon name="search" />
                    </template>
                </q-input>
            </div>

            <q-scroll-area class="col">
                <!-- No group labels; the widgets keep the group order -->
                <q-list class="q-pt-xs">
                    <WidgetPickerCard v-for="widget in visibleWidgets" :key="widget.type" :widget="widget" :locked="isLocked(widget)" @select="openWidgetEditor" />
                </q-list>
                <div v-if="visibleWidgets.length === 0" class="widget-picker__empty text-grey-7">{{ $t('common.info.noDataFound') }}</div>
            </q-scroll-area>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { IWidgetPickerType } from '../../Dashboard'
import appStore from '@/App.store'
import WidgetPickerCard from './WidgetPickerCard.vue'
import descriptor from './WidgetPickerDescriptor.json'

defineProps<{ visible?: boolean }>()
const emit = defineEmits<{
    (e: 'closeWidgetPicker'): void
    (e: 'openNewWidgetEditor', widget: IWidgetPickerType): void
}>()

const { t } = useI18n()
const store = appStore()
const panelRef = ref<HTMLElement | null>(null)
const searchText = ref<string | null>('')

const widgetTypes = (descriptor.widgets as IWidgetPickerType[]).filter((widget) => !widget.functionality || store.user.functionalities.includes(widget.functionality))

const groups = computed(() => {
    const search = (searchText.value ?? '').trim().toLowerCase()
    const visibleWidgets = search ? widgetTypes.filter((widget) => `${t(widget.name)} ${t(widget.description)}`.toLowerCase().includes(search)) : widgetTypes
    return descriptor.categories.map((category) => ({ category, widgets: visibleWidgets.filter((widget) => widget.category === category) })).filter((group) => group.widgets.length > 0)
})

// The category sets the order of the widgets
const visibleWidgets = computed(() => groups.value.flatMap((group) => group.widgets))

function isLocked(widget: IWidgetPickerType) {
    return !!widget.enterpriseOnly && !store.isEnterprise
}

function openWidgetEditor(widget: IWidgetPickerType) {
    if (isLocked(widget)) return
    // Emit a copy, so the descriptor keeps the generic 'chart' type for the next pick
    const type = widget.type === 'chart' ? (store.isEnterprise ? 'highcharts' : 'chartJS') : widget.type
    emit('openNewWidgetEditor', { ...widget, type })
}

function close() {
    emit('closeWidgetPicker')
}

function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') close()
}

function onPointerDown(event: PointerEvent) {
    const target = event.target as HTMLElement | null
    if (!target || panelRef.value?.contains(target)) return
    // The open buttons and the Quasar popups (teleported to body) do not count as outside
    if (target.closest('[data-widget-picker-trigger], .q-menu, .q-tooltip')) return
    close()
}

onMounted(() => {
    document.addEventListener('keydown', onKeydown)
    document.addEventListener('pointerdown', onPointerDown, true)
})

onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeydown)
    document.removeEventListener('pointerdown', onPointerDown, true)
})
</script>

<style lang="scss" scoped>
// Above the sheet bar breakpoint button (z-index 999), below the main menu (z-index 9000).
// DashboardController wraps the panel in a <Transition>: the v-* classes land on this root, so the backdrop fades and the panel slides
.widget-picker-layer {
    transition: opacity 0.2s ease-in;

    &__backdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background-color: var(--kn-editor-backdrop-color);
        transition: opacity 0.2s ease-in;
    }

    &.v-enter-from &__backdrop,
    &.v-leave-to &__backdrop {
        opacity: 0;
    }

    &.v-enter-from .widget-picker,
    &.v-leave-to .widget-picker {
        right: -380px;
    }
}

// From the document toolbar down to the bottom of the view, over the sheet bar
.widget-picker {
    position: absolute;
    right: 0;
    top: -35px;
    bottom: 0;
    width: min(360px, 100%);
    z-index: 1001;
    background-color: var(--kn-editor-panel-background);
    transition: right 0.2s ease-in;

    &__empty {
        padding: 16px 12px;
    }
}
</style>
