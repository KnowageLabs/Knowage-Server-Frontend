<template>
    <div v-if="advancedSettingsModel" class="q-px-md q-pb-sm">
        <q-banner class="q-mb-sm bg-grey-3" rounded dense>
            {{ $t('dashboard.widgetEditor.highcharts.advancedSettingsHint') }}
        </q-banner>
        <div v-for="(property, index) in advancedSettingsModel" :key="index" class="column-type-row row no-wrap q-mb-sm">
            <div class="kn-action-handle kn-action-handle-disabled"></div>
            <div class="col q-pa-sm">
                <div class="row q-col-gutter-sm">
                    <div class="col-6">
                        <q-input v-model="property.propertyPath" :label="$t('dashboard.widgetEditor.highcharts.property')" outlined dense />
                    </div>
                    <div class="col-6">
                        <q-input v-model="property.propertyValue" :label="$t('common.value')" outlined dense />
                    </div>
                </div>
            </div>
            <div class="kn-action-handle row items-center justify-center">
                <q-btn v-if="index === 0" flat round dense icon="add_circle" size="sm" @click="addPropertySetting()" />
                <q-btn v-else flat round dense icon="delete" size="sm" @click="removePropertySetting(index)" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IHighchartsAdvancedPropertySettings } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'

export default defineComponent({
    name: 'highcharts-advanced-settings',
    components: {},
    props: { propWidgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            widgetModel: null as IWidget | null,
            advancedSettingsModel: [] as IHighchartsAdvancedPropertySettings[]
        }
    },
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            this.widgetModel = this.propWidgetModel
            if (this.widgetModel.settings && !this.widgetModel.settings.advancedSettings) this.widgetModel.settings.advancedSettings = [{ propertyPath: '', propertyValue: '' }]
            this.advancedSettingsModel = this.widgetModel.settings.advancedSettings
        },
        addPropertySetting() {
            this.advancedSettingsModel.push({ propertyPath: '', propertyValue: '' })
        },
        removePropertySetting(index: number) {
            this.advancedSettingsModel.splice(index, 1)
        }
    }
})
</script>

<style lang="scss" scoped>
.column-type-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}
</style>
