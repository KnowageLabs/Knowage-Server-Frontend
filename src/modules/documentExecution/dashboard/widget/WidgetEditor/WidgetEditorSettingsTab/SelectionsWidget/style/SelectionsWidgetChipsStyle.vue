<template>
    <div v-if="chipsStyleModel" class="p-ai-center kn-flex p-p-4">
        <form class="p-fluid p-formgrid p-grid">
            <div class="p-field p-col-12">
                <span class="p-float-label">
                    <InputNumber v-model="chipsStyleModel.height" class="kn-material-input p-inputtext-sm" :disabled="chipsStyleDisabled" @blur="chipsStyleChanged" />
                    <label class="kn-material-input-label p-mr-2">{{ $t('common.height') }}</label>
                </span>
            </div>
        </form>

        <WidgetEditorStyleToolbar :options="descriptor.chipsToolbarStyleOptions" :prop-model="chipsStyleModel.properties" :disabled="chipsStyleDisabled" @change="onStyleToolbarChange"> </WidgetEditorStyleToolbar>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetStyleToolbarModel } from '@/modules/documentExecution/Dashboard/Dashboard'
import { ISelectionWidgetChipsStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectionsWidget'
import descriptor from '../SelectionsWidgetSettingsDescriptor.json'
import InputNumber from 'primevue/inputnumber'
import WidgetEditorStyleToolbar from '../../common/styleToolbar/WidgetEditorStyleToolbar.vue'

export default defineComponent({
    name: 'selections-widget-chips-style',
    components: { InputNumber, WidgetEditorStyleToolbar },
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true }, themeStyle: { type: Object as PropType<ISelectionWidgetChipsStyle | null>, required: true } },
    emits: ['styleChanged'],
    data() {
        return {
            descriptor,
            chipsStyleModel: null as ISelectionWidgetChipsStyle | null
        }
    },
    computed: {
        chipsStyleDisabled() {
            if (this.themeStyle) return false
            return !this.widgetModel || this.widgetModel.settings.configuration.type !== 'chips'
        }
    },
    created() {
        this.loadChipsStyleModel()
    },
    methods: {
        loadChipsStyleModel() {
            if (this.widgetModel?.settings?.style?.chips) this.chipsStyleModel = this.widgetModel.settings.style.chips
            else if (this.themeStyle) this.chipsStyleModel = this.themeStyle
        },
        chipsStyleChanged() {
            if (this.widgetModel) this.$emit('styleChanged')
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (!this.chipsStyleModel) return
            this.chipsStyleModel.properties['background-color'] = model['background-color'] ?? 'rgb(137, 158, 175)'
            this.chipsStyleModel.properties.color = model.color ?? 'rgb(255, 255, 255)'
            this.chipsStyleModel.properties['justify-content'] = model['justify-content'] ?? 'center'
            ;(this.chipsStyleModel.properties['font-size'] = model['font-size'] ?? '14px'),
                (this.chipsStyleModel.properties['font-family'] = model['font-family'] ?? ''),
                (this.chipsStyleModel.properties['font-style'] = model['font-style'] ?? 'normal'),
                (this.chipsStyleModel.properties['font-weight'] = model['font-weight'] ?? '')
            this.chipsStyleChanged()
        }
    }
})
</script>

<style lang="scss" scoped>
#height-input-container {
    max-width: 200px;
}
</style>
