<template>
    <q-item-section v-if="model" class="row items-center col-shrink">
        <q-toggle v-model="model.enabled" :label="title ? $t(title) : ''" @click.stop="onModelChange" dense />
    </q-item-section>
    <q-item-section v-else class="col-shrink">
        <span>{{ title ? $t(title) : '' }}</span>
    </q-item-section>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '../../../Dashboard'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'

export default defineComponent({
    name: 'spacer-widget-settings-accordion-header',
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        title: { type: String },
        type: { type: String, required: true }
    },
    emits: ['styleChanged'],
    data() {
        return {
            model: null as any
        }
    },
    watch: {
        type() {
            this.updateModel()
        }
    },
    mounted() {
        this.setEventListeners()
        this.updateModel()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('themeSelected', this.updateModel)
        },
        removeEventListeners() {
            emitter.off('themeSelected', this.updateModel)
        },
        loadModel() {
            if (!this.widgetModel || !this.widgetModel.settings) return null
            switch (this.type) {
                case 'Title':
                    return this.widgetModel.settings.style.title
                case 'PaddingStyle':
                    return this.widgetModel.settings.style.padding
                case 'BordersStyle':
                    return this.widgetModel.settings.style.borders
                case 'ShadowsStyle':
                    return this.widgetModel.settings.style.shadows
                case 'BackgroundColorStyle':
                    return this.widgetModel.settings.style.background
                case 'Responsive':
                    return this.widgetModel.settings.responsive
                default:
                    return null
            }
        },
        updateModel() {
            this.model = this.loadModel()
        },
        onModelChange() {
            setTimeout(() => {
                this.$emit('styleChanged')
            }, 250)
        }
    }
})
</script>
