<template>
    <div v-if="rowsStyleModel" class="q-px-md q-pb-md">
        <div class="row q-col-gutter-sm">
            <div class="col-12">
                <q-input v-model.number="rowsStyleModel.height" type="number" :label="$t('common.height')" outlined dense @blur="rowsStyleChanged" />
            </div>
            <div class="col-12"><q-separator /></div>
            <div class="col-12">
                <q-toggle v-model="rowsStyleModel.alternatedRows.enabled" :label="$t('dashboard.widgetEditor.rows.enabledAlternatedRows')" @update:model-value="rowsStyleChanged" dense />
            </div>
            <div class="col-6">
                <WidgetEditorColorPicker :initial-value="rowsStyleModel.alternatedRows.evenBackgroundColor" :label="$t('dashboard.widgetEditor.rows.alternatedRowsEven')" :disabled="!rowsStyleModel.alternatedRows.enabled" @change="onBackroundColorChanged($event, 'even')" />
            </div>
            <div class="col-6">
                <WidgetEditorColorPicker :initial-value="rowsStyleModel.alternatedRows.oddBackgroundColor" :label="$t('dashboard.widgetEditor.rows.alternatedRowsOdd')" :disabled="!rowsStyleModel.alternatedRows.enabled" @change="onBackroundColorChanged($event, 'odd')" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetRowsStyle } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import WidgetEditorColorPicker from '../../common/WidgetEditorColorPicker.vue'

export default defineComponent({
    name: 'widget-rows-style',
    components: { WidgetEditorColorPicker },
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true }, themeStyle: { type: Object as PropType<IWidgetRowsStyle | null>, required: true } },
    emits: ['styleChanged'],
    data() {
        return {
            rowsStyleModel: null as IWidgetRowsStyle | null,
            widgetType: '' as string
        }
    },
    mounted() {
        this.setEventListeners()
        this.loadRowsModel()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('themeSelected', this.loadRowsModel)
        },
        removeEventListeners() {
            emitter.off('themeSelected', this.loadRowsModel)
        },
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
