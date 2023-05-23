<template>
    <div v-if="splittingSettings" class="p-grid p-jc-center p-ai-center p-p-4">
        <div class="p-col-12">
            {{ splittingSettings }}
        </div>

        <Message class="p-col-12 p-mx-4" severity="info" :closable="false">
            {{ $t('dashboard.widgetEditor.highcharts.splitting.hint') }}
        </Message>

        <div class="p-col-12 p-d-flex p-flex-column kn-flex p-p-2">
            <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.highcharts.splitting.secondCategory') }}</label>
            <Dropdown v-model="splittingSettings.groupedSerie" class="kn-material-input" :options="measureColumns" option-value="columnName" option-label="columnName"> </Dropdown>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import Message from 'primevue/message'
import Dropdown from 'primevue/dropdown'

export default defineComponent({
    name: 'highcharts-radar-splitting-settings',
    components: { Dropdown, Message },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            model: null as IWidget | null,
            splittingSettings: null as any
        }
    },
    computed: {
        splittingSettingsDisabled() {
            return !this.splittingSettings || !this.splittingSettings.enabled
        },
        measureColumns() {
            return this.widgetModel.columns.filter((column: IWidgetColumn) => column.fieldType === 'MEASURE')
        }
    },
    watch: {
        splittingSettingsDisabled() {
            this.onSplittingSettingsEnabledChanged()
        }
    },
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            this.model = this.widgetModel
            if (this.model?.settings?.configuration) this.splittingSettings = this.model.settings.configuration.splitting
        },
        onSplittingSettingsEnabledChanged() {
            if (this.splittingSettings?.enabled && this.model) {
                let attributesFound = 0
                for (let i = 0; i < this.model.columns.length; i++) {
                    if (this.model.columns[i].fieldType === 'ATTRIBUTE') {
                        attributesFound++
                        if (attributesFound === 3) this.model.columns.splice(i, 0)
                    }
                }
            }
        }
    }
})
</script>
