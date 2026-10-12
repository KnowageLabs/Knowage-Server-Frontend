<template>
    <q-item class="widget-picker-row" :class="{ 'widget-picker-row--locked': locked }" :data-tour-id="locked ? 'picker-locked' : undefined" clickable :disable="locked" data-test="list-item" @click="emit('select', widget)">
        <q-item-section avatar class="widget-picker-row__avatar">
            <div class="widget-picker-row__tile">
                <div class="widget-picker-row__icon" :style="iconStyle"></div>
            </div>
        </q-item-section>
        <q-item-section>
            <q-item-label class="widget-picker-row__name">
                {{ $t(widget.name) }}
                <q-badge v-if="locked" color="accent" class="q-ml-xs" label="EE" />
            </q-item-label>
            <q-item-label class="widget-picker-row__description text-grey-7" lines="2">{{ $t(widget.description) }}</q-item-label>
        </q-item-section>
        <q-tooltip :delay="500" anchor="center left" self="center right" max-width="260px">{{ locked ? $t('dashboard.widgets.eeOnly') : $t(widget.description) }}</q-tooltip>
    </q-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IWidgetPickerType } from '../../Dashboard'
import descriptor from './WidgetPickerDescriptor.json'

const props = defineProps<{ widget: IWidgetPickerType; locked: boolean }>()
const emit = defineEmits<{ (e: 'select', widget: IWidgetPickerType): void }>()

const iconStyle = computed(() => {
    // Both chart engines share one icon
    const image = props.widget.type === 'highcharts' || props.widget.type === 'chartJS' ? 'chart' : props.widget.type
    const url = `url(${import.meta.env.VITE_KNOWAGE_VUE_CONTEXT}${descriptor.imagePath}${image}${descriptor.imageExtension})`
    return { 'mask-image': url, '-webkit-mask-image': url }
})
</script>

<style lang="scss" scoped>
.widget-picker-row {
    min-height: 56px;
    padding: 8px 12px;

    &__avatar {
        min-width: 52px;
    }

    &__tile {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background-color: var(--kn-color-secondary);
        transition: background-color 0.2s ease-in;
    }

    &__icon {
        width: 100%;
        height: 100%;
        background-color: var(--kn-color-primary);
        mask-size: 70%;
        mask-repeat: no-repeat;
        mask-position: center;
        -webkit-mask-size: 70%;
        -webkit-mask-repeat: no-repeat;
        -webkit-mask-position: center;
        transition: background-color 0.2s ease-in;
    }

    &__name {
        font-size: 14px;
        font-weight: 500;
        text-transform: capitalize;
    }

    &__description {
        font-size: 12px;
        line-height: 1.35;
    }

    &:not(.widget-picker-row--locked):hover {
        .widget-picker-row__tile {
            background-color: var(--kn-color-primary);
        }
        .widget-picker-row__icon {
            background-color: var(--kn-editor-panel-background);
        }
    }
}
</style>
