<template>
    <q-item-section v-if="model" class="row items-center col-shrink">
        <q-toggle v-model="model[property]" :label="title ? $t(title) : ''" @click.stop="onModelChange" dense />
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
    name: 'chart-j-s-widget-settings-accordion-header',
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, title: { type: String }, type: { type: String, required: true } },
    emits: ['styleChanged'],
    data() {
        return {
            model: null as any,
            property: 'enabled' as string
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
            if (!this.widgetModel || !this.widgetModel.settings || !this.widgetModel.settings.chartModel) return null
            switch (this.type) {
                case 'MenuConfiguration':
                    return this.widgetModel.settings.configuration.widgetMenu
                case 'Title':
                    return this.widgetModel.settings.style.title
                case 'BackgroundColorStyle':
                    return this.widgetModel.settings.style.background
                case 'BordersStyle':
                    return this.widgetModel.settings.style.borders
                case 'PaddingStyle':
                    return this.widgetModel.settings.style.padding
                case 'ShadowsStyle':
                    return this.widgetModel.settings.style.shadows
                case 'Legend':
                    this.property = 'display'
                    return this.widgetModel.settings.chartModel.model?.options?.plugins?.legend
                case 'Tooltip':
                    return this.widgetModel.settings.chartModel.model?.options?.plugins?.tooltip
                case 'Selection':
                    return this.widgetModel.settings.interactions.selection
                case 'CrossNavigation':
                    return this.widgetModel.settings.interactions.crossNavigation
                case 'Link':
                    return this.widgetModel.settings.interactions.link
                case 'Preview':
                    return this.widgetModel.settings.interactions.preview
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
                case 'Legend':
                case 'Tooltip':
                    setTimeout(() => emitter.emit('refreshChart', this.widgetModel.id), 250)
                    break
                case 'Header':
                case 'Title':
                case 'BackgroundColorStyle':
                case 'BordersStyle':
                case 'PaddingStyle':
                case 'ShadowsStyle':
                    this.$emit('styleChanged')
            }
        }
    }
})
</script>
