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
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'

export default defineComponent({
    name: 'selector-widget-settings-accordion-header',
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, title: { type: String }, type: { type: String, required: true } },
    emits: ['styleChanged'],
    data() {
        return {
            model: null as any
        }
    },
    computed: {},
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
                case 'MenuConfiguration':
                    return this.widgetModel.settings.configuration.widgetMenu
                case 'DefaultValues':
                    return this.widgetModel.settings.configuration.defaultValues
                case 'Title':
                    return this.widgetModel.settings.style.title
                case 'LabelStyle':
                    return this.widgetModel.settings.style.label
                case 'BackgroundColorStyle':
                    return this.widgetModel.settings.style.background
                case 'BordersStyle':
                    return this.widgetModel.settings.style.borders
                case 'PaddingStyle':
                    return this.widgetModel.settings.style.padding
                case 'ShadowsStyle':
                    return this.widgetModel.settings.style.shadows
                case 'HelpSettings':
                    return this.widgetModel.settings.help
                default:
                    return null
            }
        },
        updateModel() {
            this.model = this.loadModel()
        },
        onModelChange() {
            switch (this.type) {
                case 'DefaultValues':
                    setTimeout(() => emitter.emit('defaultValuesChanged', this.widgetModel.id), 250)
                    this.refreshSelector()
                    break
                case 'Title':
                case 'LabelStyle':
                case 'BackgroundColorStyle':
                case 'BordersStyle':
                case 'PaddingStyle':
                case 'ShadowsStyle':
                    this.$emit('styleChanged')
                    this.refreshSelector()
            }
        },
        refreshSelector() {
            setTimeout(() => emitter.emit('refreshSelector', this.widgetModel.id), 250)
        }
    }
})
</script>
