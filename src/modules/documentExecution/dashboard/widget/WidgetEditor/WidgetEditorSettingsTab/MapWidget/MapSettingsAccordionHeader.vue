<template>
    <div class="p-d-flex p-flex-row p-ai-center">
        <InputSwitch v-if="model" v-model="model.enabled" class="p-mr-3" @click.stop="onModelChange"></InputSwitch>
        <label class="kn-material-input-label">{{ title ? $t(title) : '' }}</label>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import InputSwitch from 'primevue/inputswitch'

export default defineComponent({
    name: 'map-settings-accordion-header',
    components: { InputSwitch },
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
                case 'Tooltips':
                    return this.widgetModel.settings.tooltips
                case 'DialogSettings':
                    return this.widgetModel.settings.dialog
                case 'Legend':
                    return this.widgetModel.settings.legend
                case 'BaseLayer':
                    return this.widgetModel.settings.configuration.baseLayer
                case 'Conditions':
                    return this.widgetModel.settings.conditionalStyles
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
