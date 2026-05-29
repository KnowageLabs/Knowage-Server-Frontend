<template>
    <div v-if="datetypeSettings" class="q-px-md q-pb-sm">
        <div class="row q-col-gutter-sm q-mb-sm">
            <div class="col-6">
                <q-select v-model="datetypeSettings.format" :label="$t('managers.datasetManagement.ckanDateFormat')" outlined dense :options="descriptor.dateFormats" :disable="datetypeSettingsDisabled" @update:model-value="modelChanged">
                    <template #selected-item="slotProps">
                        <span>{{ getFormattedDate(new Date(), slotProps.opt) }}</span>
                    </template>
                    <template #option="slotProps">
                        <q-item v-bind="slotProps.itemProps">
                            <q-item-section
                                ><q-item-label>{{ getFormattedDate(new Date(), slotProps.opt) }}</q-item-label></q-item-section
                            >
                        </q-item>
                    </template>
                </q-select>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { formatDate } from '@/helpers/commons/localeHelper'
import descriptor from './HighchartsConfigurationDescriptor.json'

export default defineComponent({
    name: 'highcharts-datetype-settings',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            datetypeSettings: null as any
        }
    },
    computed: {
        datetypeSettingsDisabled() {
            return !this.datetypeSettings || !this.datetypeSettings.enabled
        }
    },
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            if (this.widgetModel.settings?.configuration) this.datetypeSettings = this.widgetModel.settings.configuration.datetypeSettings
        },
        modelChanged() {
            emitter.emit('refreshChart', this.widgetModel.id)
        },
        getFormattedDate(date: any, format: any) {
            return formatDate(date, format)
        }
    }
})
</script>
