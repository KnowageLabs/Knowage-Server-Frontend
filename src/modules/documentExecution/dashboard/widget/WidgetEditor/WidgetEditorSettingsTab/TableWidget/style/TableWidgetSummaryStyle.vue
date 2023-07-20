<template>
    <div v-if="summaryStyleModel" class="p-grid p-jc-center p-ai-center p-p-4">
        <div class="p-col-12">
            <WidgetEditorStyleToolbar :options="settingsDescriptor.defaultToolbarStyleOptions" :prop-model="summaryStyleModel" :disabled="summaryStyleDisabled" @change="onStyleToolbarChange($event)"> </WidgetEditorStyleToolbar>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, ITableWidgetSummaryStyle, IWidgetStyleToolbarModel } from '@/modules/documentExecution/dashboard/Dashboard'
import settingsDescriptor from '../../WidgetEditorSettingsTabDescriptor.json'
import WidgetEditorStyleToolbar from '../../common/styleToolbar/WidgetEditorStyleToolbar.vue'

export default defineComponent({
    name: 'table-widget-summary-style',
    components: { WidgetEditorStyleToolbar },
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true }, themeStyle: { type: Object as PropType<ITableWidgetSummaryStyle | null>, required: true } },
    emits: ['styleChanged'],
    data() {
        return {
            settingsDescriptor,
            model: {} as IWidget | null,
            summaryStyleModel: null as ITableWidgetSummaryStyle | null
        }
    },
    computed: {
        summaryStyleDisabled() {
            if (this.themeStyle) return false
            return !this.model || !this.model.settings?.configuration?.summaryRows?.enabled
        }
    },
    watch: {
        widgetModel() {
            this.loadModel()
        }
    },
    created() {
        this.loadModel()
        this.loadSummaryRowsStyle()
    },
    methods: {
        loadModel() {
            this.model = this.widgetModel
        },
        loadSummaryRowsStyle() {
            if (this.widgetModel?.settings?.style?.summary) this.summaryStyleModel = this.widgetModel.settings.style.summary
            else if (this.themeStyle) this.summaryStyleModel = this.themeStyle
        },
        summaryStyleChanged() {
            if (this.widgetModel) this.$emit('styleChanged')
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            this.summaryStyleModel = {
                'background-color': model['background-color'] ?? '',
                color: model.color ?? '',
                'justify-content': model['justify-content'] ?? '',
                'font-size': model['font-size'] ?? '14px',
                'font-family': model['font-family'] ?? '',
                'font-style': model['font-style'] ?? '',
                'font-weight': model['font-weight'] ?? ''
            }
            if (this.model) this.model.settings.style.summary = this.summaryStyleModel
            this.summaryStyleChanged()
        }
    }
})
</script>

<style lang="scss" scoped>
#height-input-container {
    max-width: 200px;
}
</style>
