<template>
    <div class="q-px-md q-pb-md">
        <div class="row no-wrap items-center q-mb-md">
            <div class="col">
                <WidgetEditorColorPicker :initial-value="customColorValue" :label="$t('dashboard.widgetEditor.colors.customColor')" @change="customColorValue = $event" />
            </div>
            <div class="col-auto q-pl-sm">
                <q-btn flat round dense color="primary" icon="add" :disable="!customColorValue" @click="addColor">
                    <q-tooltip>{{ $t('common.add') }}</q-tooltip>
                </q-btn>
            </div>
        </div>

        <div v-if="colorsModel">
            <div v-for="(color, index) in colorsModel" :key="index" class="color-row row no-wrap items-center q-mb-xs" :class="{ 'color-row--drag-over': activeDropzone === index }" @dragover.prevent="activeDropzone = index" @dragleave="activeDropzone = -1" @drop.prevent="onDropAtIndex(index)">
                <div class="kn-drag-handle row items-center justify-center" draggable="true" @dragstart="onDragStart(index)" @dragend="activeDropzone = -1">
                    <q-icon name="drag_indicator" size="xs" class="text-grey-5" />
                </div>
                <div class="color-text-input row items-center">
                    <q-input v-model="colorsModel[index]" dense borderless @update:model-value="colorsChanged" />
                </div>
                <div class="color-swatch col cursor-pointer" :style="`background-color: ${color}`">
                    <q-menu touch-position>
                        <q-color v-model="colorsModel[index]" format-model="hexa" @update:model-value="colorsChanged" />
                    </q-menu>
                </div>
                <div class="kn-action-handle row items-center justify-center">
                    <q-btn flat round dense size="sm" icon="delete" @click="deleteColor(index)" />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import deepcopy from 'deepcopy'
import WidgetEditorColorPicker from '../../common/WidgetEditorColorPicker.vue'

export default defineComponent({
    name: 'map-chart-color-picker',
    components: { WidgetEditorColorPicker },
    props: { modelValue: { type: Array as PropType<string[]>, required: true } },
    emits: ['update:modelValue'],
    data() {
        return {
            customColorValue: '#8D8D8D',
            colorsModel: null as string[] | null,
            dragIndex: -1,
            activeDropzone: -1
        }
    },
    watch: {
        modelValue() {
            this.colorsModel = deepcopy(this.modelValue)
        }
    },
    created() {
        this.colorsModel = deepcopy(this.modelValue)
    },
    methods: {
        onDragStart(index: number) {
            this.dragIndex = index
        },
        onDropAtIndex(dropIndex: number) {
            if (!this.colorsModel || this.dragIndex === -1 || this.dragIndex === dropIndex) return
            const moved = this.colorsModel.splice(this.dragIndex, 1)[0]
            this.colorsModel.splice(dropIndex, 0, moved)
            this.dragIndex = -1
            this.activeDropzone = -1
            this.colorsChanged()
        },
        addColor() {
            if (!this.colorsModel) return
            this.colorsModel.push(this.customColorValue)
            this.colorsChanged()
        },
        deleteColor(index: number) {
            if (!this.colorsModel) return
            this.colorsModel.splice(index, 1)
            this.colorsChanged()
        },
        colorsChanged() {
            this.$emit('update:modelValue', deepcopy(this.colorsModel))
        }
    }
})
</script>

<style lang="scss" scoped>
.color-row {
    border-radius: 4px;
    overflow: hidden;
    height: 32px;
    cursor: default;
    transition: box-shadow 0.15s;
    border: 1px solid #d0d0d0;

    &--drag-over {
        box-shadow: 0 -2px 0 0 var(--q-primary);
    }

    .kn-drag-handle {
        width: 28px;
        flex-shrink: 0;
        background-color: #f0f0f0;
        height: 100%;
        cursor: grab;
    }

    .color-swatch {
        flex-shrink: 1;
        height: 100%;
    }

    .color-text-input {
        width: 125px;
        flex-shrink: 0;
        background-color: #f0f0f0;
        padding: 0 4px;
        border: 1px solid #d0d0d0;

        :deep(.q-field__native) {
            font-size: 0.75rem;
            font-family: monospace;
        }
    }

    .kn-action-handle {
        width: 36px;
        flex-shrink: 0;
        background-color: #f0f0f0;
        height: 100%;
    }
}
</style>
