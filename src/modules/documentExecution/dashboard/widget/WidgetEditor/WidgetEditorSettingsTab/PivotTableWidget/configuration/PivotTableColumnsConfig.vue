<template>
    <div v-if="responsiveModel" class="q-px-md q-pb-md">
        <div class="row q-col-gutter-sm q-mb-sm">
            <div v-for="(field, index) in descriptor.rowTotals" :key="index" class="col-6 q-gutter-y-sm">
                <q-toggle v-model="responsiveModel[field]" :label="getLabel(field)" dense />
                <q-input v-model="responsiveModel[`${field}Label`]" :label="getLabel(`${field}Label`)" outlined dense :disable="!responsiveModel[field]" />
            </div>
        </div>
        <div class="q-mb-sm">
            <q-select v-model="responsiveModel.excludedFromSubTotals" :options="columnFields" :label="$t('dashboard.widgetEditor.pivot.configuration.excludedFromSubTotals')" option-label="alias" option-value="id" multiple emit-value map-options outlined dense />
        </div>
        <q-toggle v-model="responsiveModel.colsExpanded" :label="$t('dashboard.widgetEditor.pivot.configuration.colsExpanded')" dense />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { IPivotColumnsConfiguration } from '@/modules/documentExecution/dashboard/interfaces/pivotTable/DashboardPivotTableWidget'
import descriptor from './PivotTableConfigDescriptor.json'

export default defineComponent({
    name: 'widget-responsive',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            responsiveModel: null as IPivotColumnsConfiguration | null
        }
    },
    computed: {
        columnFields(): IWidgetColumn[] {
            return this.widgetModel.fields?.columns ?? []
        }
    },
    created() {
        this.loadResponsiveModel()
    },
    methods: {
        loadResponsiveModel() {
            if (this.widgetModel.settings.configuration.columns) this.responsiveModel = this.widgetModel.settings.configuration.columns
        },
        getLabel(field: string) {
            switch (field) {
                case 'grandTotal':
                    return this.$t('dashboard.widgetEditor.pivot.configuration.grandTotal')
                case 'subTotal':
                    return this.$t('dashboard.widgetEditor.pivot.configuration.subtotal')
                case 'subTotalLabel':
                    return this.$t('dashboard.widgetEditor.pivot.configuration.subTotalLabel')
                case 'grandTotalLabel':
                    return this.$t('dashboard.widgetEditor.pivot.configuration.grandTotalLabel')
            }
        }
    }
})
</script>
