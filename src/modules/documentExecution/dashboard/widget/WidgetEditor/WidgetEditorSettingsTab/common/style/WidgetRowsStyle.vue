<template>
    <div v-if="rowsStyleModel" class="p-ai-center kn-flex p-p-4">
        <form class="p-fluid p-formgrid p-grid">
            <div class="p-field p-col-12 p-mb-4">
                <span class="p-float-label">
                    <InputNumber v-model="rowsStyleModel.height" class="kn-material-input p-inputtext-sm" @blur="rowsStyleChanged" />
                    <label class="kn-material-input-label p-mr-2">{{ $t('common.height') }}</label>
                </span>
            </div>
            <div class="p-field p-col-12 p-mb-4 p-d-flex p-flex-row p-ai-center">
                <InputSwitch v-model="rowsStyleModel.alternatedRows.enabled" class="p-mr-2" @change="rowsStyleChanged"></InputSwitch>
                <label class="kn-material-input-label p-m-0">{{ $t('dashboard.widgetEditor.rows.enabledAlternatedRows') }}</label>
            </div>
            <div class="p-field p-col-12 p-md-6">
                <WidgetEditorColorPicker :initial-value="rowsStyleModel.alternatedRows.evenBackgroundColor" :label="$t('dashboard.widgetEditor.rows.alternatedRowsEven')" :disabled="!rowsStyleModel.alternatedRows.enabled" @change="onBackroundColorChanged($event, 'even')"></WidgetEditorColorPicker>
            </div>
            <div class="p-field p-col-12 p-md-6">
                <WidgetEditorColorPicker :initial-value="rowsStyleModel.alternatedRows.oddBackgroundColor" :label="$t('dashboard.widgetEditor.rows.alternatedRowsOdd')" :disabled="!rowsStyleModel.alternatedRows.enabled" @change="onBackroundColorChanged($event, 'odd')"></WidgetEditorColorPicker>
            </div>
        </form>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetRowsStyle } from '@/modules/documentExecution/dashboard/Dashboard'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import WidgetEditorColorPicker from '../../common/WidgetEditorColorPicker.vue'

export default defineComponent({
    name: 'widget-rows-style',
    components: { InputNumber, InputSwitch, WidgetEditorColorPicker },
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true }, themeStyle: { type: Object as PropType<IWidgetRowsStyle | null>, required: true } },
    emits: ['styleChanged'],
    data() {
        return {
            rowsStyleModel: null as IWidgetRowsStyle | null,
            widgetType: '' as string
        }
    },
    created() {
        this.loadRowsModel()
    },
    methods: {
        loadRowsModel() {
            if (this.widgetModel?.settings?.style?.rows) this.rowsStyleModel = this.widgetModel.settings.style.rows
            else if (this.themeStyle) this.rowsStyleModel = this.themeStyle
        },
        rowsStyleChanged() {
            if (this.widgetModel) this.$emit('styleChanged')
        },
        onBackroundColorChanged(event: string | null, type: 'even' | 'odd') {
            if (!event || !this.rowsStyleModel) return
            type === 'even' ? (this.rowsStyleModel.alternatedRows.evenBackgroundColor = event) : (this.rowsStyleModel.alternatedRows.oddBackgroundColor = event)
            this.rowsStyleChanged()
        }
    }
})
</script>

<style lang="scss" scoped>
#height-input-container {
    max-width: 200px;
}
</style>
