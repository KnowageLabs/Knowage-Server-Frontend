<template>
    <div v-if="noSelectionsModel" class="q-px-md q-pb-md row">
        <div class="col-12">
            <q-input v-model="noSelectionsModel.customText" :label="$t('dashboard.widgetEditor.noSelections.customMessage')" :hint="$t('dashboard.widgetEditor.noSelections.customMessageHint')" outlined dense :disable="noSelectionsDisabled" @change="noSelectionsConfigurationChanged" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { ISelectionsWidgetNoSelections } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectionsWidget'
import { emitter } from '../../../../../DashboardHelpers'
import descriptor from '../SelectionsWidgetSettingsDescriptor.json'

export default defineComponent({
    name: 'selections-no-selection-configuration',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            noSelectionsModel: null as ISelectionsWidgetNoSelections | null
        }
    },
    computed: {
        noSelectionsDisabled() {
            return !this.noSelectionsModel || !this.noSelectionsModel.enabled
        }
    },
    created() {
        this.loadNoSelectionsConfiguration()
    },
    methods: {
        loadNoSelectionsConfiguration() {
            if (this.widgetModel.settings?.configuration?.noSelections) this.noSelectionsModel = this.widgetModel.settings.configuration.noSelections
        },
        noSelectionsConfigurationChanged() {
            emitter.emit('refreshSelections', this.widgetModel.id)
        }
    }
})
</script>
