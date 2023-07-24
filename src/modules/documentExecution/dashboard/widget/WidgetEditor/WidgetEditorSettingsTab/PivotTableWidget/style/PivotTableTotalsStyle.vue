<template>
    <div v-if="totalsStyleModel" class="p-ai-center kn-flex p-p-4">
        <span v-if="themeStyle" class="p-d-flex p-flex-row p-ai-center p-mb-2"> {{ $t('common.enabled') }} <q-toggle v-model="totalsStyleModel.enabled" color="black" /> </span>

        <WidgetEditorStyleToolbar :options="toolbarStyleSettings" :prop-model="totalsStyleModel.properties" :disabled="totalsStyleDisabled" @change="onStyleToolbarChange"> </WidgetEditorStyleToolbar>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetStyleToolbarModel } from '@/modules/documentExecution/Dashboard/Dashboard'
import { IPivotTotal } from '@/modules/documentExecution/dashboard/interfaces/pivotTable/DashboardPivotTableWidget'
import WidgetEditorStyleToolbar from '../../common/styleToolbar/WidgetEditorStyleToolbar.vue'
import * as pivotTableDefaultValues from '../../../helpers/pivotTableWidget/PivotTableDefaultValues'

export default defineComponent({
    name: 'pivot-table-total-style',
    components: { WidgetEditorStyleToolbar },
    props: {
        widgetModel: { type: Object as PropType<IWidget | null>, required: true },
        themeStyle: { type: Object as PropType<IPivotTotal | null>, required: true },
        toolbarStyleSettings: { type: Array, required: true },
        totalType: { type: String, required: true }
    },
    emits: ['styleChanged'],
    data() {
        return {
            totalsStyleModel: null as IPivotTotal | null
        }
    },
    computed: {
        totalsStyleDisabled() {
            return !this.totalsStyleModel || !this.totalsStyleModel.enabled
        }
    },
    created() {
        this.loadStyle()
    },
    methods: {
        loadStyle() {
            // if (!this.widgetModel) return
            if (this.widgetModel) {
                if (this.totalType == 'Totals' && this.widgetModel.settings?.style?.totals) this.totalsStyleModel = this.widgetModel.settings.style.totals
                else if (this.totalType == 'SubTotals' && this.widgetModel.settings?.style?.subTotals) this.totalsStyleModel = this.widgetModel.settings.style.subTotals
                else if (this.totalType == 'CrossTabHeaders' && this.widgetModel.settings?.style?.crossTabHeaders) this.totalsStyleModel = this.widgetModel.settings.style.crossTabHeaders
            } else this.totalsStyleModel = this.themeStyle
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (!this.totalsStyleModel) return
            const defaultTotalsStyle = pivotTableDefaultValues.getDefaultTotals()
            this.totalsStyleModel.properties = {
                'background-color': model['background-color'] ?? defaultTotalsStyle.properties['background-color'],
                color: model.color ?? defaultTotalsStyle.properties.color,
                'text-align': model['text-align'] ?? defaultTotalsStyle.properties['text-align'],
                'font-size': model['font-size'] ?? defaultTotalsStyle.properties['font-size'],
                'font-family': model['font-family'] ?? defaultTotalsStyle.properties['font-family'],
                'font-style': model['font-style'] ?? defaultTotalsStyle.properties['font-style'],
                'font-weight': model['font-weight'] ?? defaultTotalsStyle.properties['font-weight']
            }
            if (this.widgetModel) this.$emit('styleChanged')
        }
    }
})
</script>
