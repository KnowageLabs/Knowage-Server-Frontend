<template>
    <div v-if="valuesManagementModel" class="q-pa-sm column">
        <span class="row items-center">
            <q-toggle v-model="valuesManagementModel.hideDisabled" :label="$t('dashboard.widgetEditor.valuesManagement.hideDisabledValues')" @update:model-value="onHideDisabledChanged" />
            <q-icon name="help_outline" class="cursor-pointer q-ml-auto q-mr-sm" size="xs">
                <q-tooltip>{{ $t('dashboard.widgetEditor.valuesManagement.hideDisabledValuesHint') }}</q-tooltip>
            </q-icon>
        </span>
        <span class="row items-center">
            <q-toggle v-model="valuesManagementModel.enableAll" :label="$t('dashboard.widgetEditor.valuesManagement.alwaysEnableValues')" @update:model-value="onEnableAllChange" />
            <q-icon name="help_outline" class="cursor-pointer q-ml-auto q-mr-sm" size="xs">
                <q-tooltip>{{ $t('dashboard.widgetEditor.valuesManagement.alwaysEnableValuesHint') }}</q-tooltip>
            </q-icon>
        </span>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { ISelectorWidgetValuesManagement } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import { emitter } from '../../../../../DashboardHelpers'
import descriptor from '../SelectorWidgetSettingsDescriptor.json'

export default defineComponent({
    name: 'selector-widget-values-management',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            valuesManagementModel: null as ISelectorWidgetValuesManagement | null
        }
    },
    created() {
        this.loadDefaultValuesModel()
    },
    methods: {
        loadDefaultValuesModel() {
            if (this.widgetModel.settings?.configuration?.valuesManagement) this.valuesManagementModel = this.widgetModel.settings.configuration.valuesManagement
        },
        valuesManagementChanged() {
            emitter.emit('valuesManagementChanged', this.widgetModel.id)
            emitter.emit('refreshSelector', this.widgetModel.id)
        },
        onHideDisabledChanged() {
            if (!this.valuesManagementModel) return
            if (this.valuesManagementModel.hideDisabled) this.valuesManagementModel.enableAll = false
            this.valuesManagementChanged()
        },
        onEnableAllChange() {
            if (!this.valuesManagementModel) return
            if (this.valuesManagementModel.enableAll) this.valuesManagementModel.hideDisabled = false
            this.valuesManagementChanged()
        }
    }
})
</script>
