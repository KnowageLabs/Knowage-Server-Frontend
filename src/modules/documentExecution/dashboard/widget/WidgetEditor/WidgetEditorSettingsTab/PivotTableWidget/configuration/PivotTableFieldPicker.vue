<template>
    <div v-if="responsiveModel" class="row q-col-gutter-sm q-px-md q-pb-md">
        <div class="col-6">
            <q-input v-model.number="responsiveModel.width" type="number" :label="$t('common.width')" :disable="!responsiveModel.enabled" outlined dense />
        </div>
        <div class="col-6">
            <q-input v-model.number="responsiveModel.height" type="number" :label="$t('common.height')" :disable="!responsiveModel.enabled" outlined dense />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IPivotFieldPicker } from '@/modules/documentExecution/dashboard/interfaces/pivotTable/DashboardPivotTableWidget'
import descriptor from './PivotTableConfigDescriptor.json'

export default defineComponent({
    name: 'widget-responsive',
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            responsiveModel: null as IPivotFieldPicker | null
        }
    },
    created() {
        this.loadResponsiveModel()
    },
    methods: {
        loadResponsiveModel() {
            if (this.widgetModel.settings.configuration.fieldPicker) this.responsiveModel = this.widgetModel.settings.configuration.fieldPicker
        }
    }
})
</script>
