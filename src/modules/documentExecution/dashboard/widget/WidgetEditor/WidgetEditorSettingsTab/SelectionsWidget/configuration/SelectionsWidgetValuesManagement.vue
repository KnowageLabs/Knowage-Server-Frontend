<template>
    <div v-if="valuesManagementModel" class="q-px-md q-pb-md">
        <div class="col-12 row items-center">
            <q-toggle v-model="valuesManagementModel.showDataset" :label="$t('dashboard.widgetEditor.valuesManagement.showDataset')" @update:model-value="valuesManagementChanged" />
            <q-icon name="help_outline" class="q-ml-auto cursor-pointer" size="xs">
                <q-tooltip>{{ $t('dashboard.widgetEditor.valuesManagement.showDatasetHint') }}</q-tooltip>
            </q-icon>
        </div>
        <div class="col-12 row items-center">
            <q-toggle v-model="valuesManagementModel.showColumn" :label="$t('dashboard.widgetEditor.valuesManagement.showColumn')" @update:model-value="valuesManagementChanged" />
            <q-icon name="help_outline" class="q-ml-auto cursor-pointer" size="xs">
                <q-tooltip>{{ $t('dashboard.widgetEditor.valuesManagement.showColumnHint') }}</q-tooltip>
            </q-icon>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { ISelectionsWidgetValuesManagement } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectionsWidget'
import { emitter } from '../../../../../DashboardHelpers'
import descriptor from '../SelectionsWidgetSettingsDescriptor.json'

export default defineComponent({
    name: 'selections-widget-values-management',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            valuesManagementModel: null as ISelectionsWidgetValuesManagement | null
        }
    },
    created() {
        this.loadValuesManagementModel()
    },
    methods: {
        loadValuesManagementModel() {
            if (this.widgetModel.settings?.configuration?.valuesManagement) this.valuesManagementModel = this.widgetModel.settings.configuration.valuesManagement
        },
        valuesManagementChanged() {
            emitter.emit('valuesManagementChanged', this.valuesManagementModel)
            emitter.emit('refreshSelections', this.widgetModel.id)
        }
    }
})
</script>
