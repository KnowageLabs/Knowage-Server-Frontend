<template>
    <div v-if="facetSettings" class="q-px-md q-pb-md">
        <div class="row q-col-gutter-sm q-mb-sm">
            <div class="col-12">
                <q-select v-model="facetSettings.columns" :options="widgetModel.columns.filter((column: any) => column.fieldType === 'ATTRIBUTE')" option-label="columnName" option-value="columnName" :label="$t('common.columns')" multiple use-chips outlined dense :disable="facetSettingsDisabled" @update:model-value="facetsSettingsChanged" />
            </div>
        </div>
        <div class="row q-col-gutter-sm q-mb-sm">
            <div class="col-auto">
                <q-toggle v-model="facetSettings.selection" :label="$t('dashboard.widgetEditor.discoveryWidget.facets.enableSelection')" dense :disable="facetSettingsDisabled" @update:model-value="facetsSettingsChanged" />
            </div>
            <div class="col-auto">
                <q-toggle v-model="facetSettings.closedByDefault" :label="$t('dashboard.widgetEditor.discoveryWidget.facets.closedByDefault')" dense :disable="facetSettingsDisabled" @update:model-value="facetsSettingsChanged" />
            </div>
        </div>
        <div class="row q-col-gutter-sm">
            <div class="col-4">
                <q-input v-model="facetSettings.width" :label="$t('dashboard.widgetEditor.discoveryWidget.facets.columnWidth')" :placeholder="$t('dashboard.widgetEditor.inputHintForPixels')" outlined dense :disable="facetSettingsDisabled" @change="facetsSettingsChanged" />
            </div>
            <div class="col-4">
                <q-input v-model.number="facetSettings.limit" type="number" :label="$t('dashboard.widgetEditor.discoveryWidget.facets.maxNumber')" outlined dense :disable="facetSettingsDisabled" @change="onInputNumberChanged" />
            </div>
            <div class="col-4">
                <q-input v-model.number="facetSettings.precision" type="number" :label="$t('dashboard.widgetEditor.discoveryWidget.facets.decimalPrecision')" outlined dense :disable="facetSettingsDisabled" @change="onInputNumberChanged" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { IDiscoveryWidgetFacetsSettings } from '@/modules/documentExecution/dashboard/interfaces/DashboardDiscoveryWidget'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
export default defineComponent({
    name: 'discovery-widget-facets-settings',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, dashboardId: { type: String, required: true } },
    data() {
        return {
            facetSettings: null as IDiscoveryWidgetFacetsSettings | null
        }
    },
    computed: {
        facetSettingsDisabled(): boolean {
            return !this.facetSettings || !this.facetSettings.enabled
        }
    },
    created() {
        this.setEventListeners()
        this.loadFacetsSettings()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('columnAdded', this.onColumnAdded)
            emitter.on('columnRemoved', this.onColumnRemoved)
        },
        removeEventListeners() {
            emitter.off('columnAdded', this.onColumnAdded)
            emitter.off('columnRemoved', this.onColumnRemoved)
        },
        loadFacetsSettings() {
            if (this.widgetModel.settings?.facets) this.facetSettings = this.widgetModel.settings.facets
        },
        facetsSettingsChanged() {
            emitter.emit('refreshTable', this.widgetModel.id)
        },
        onInputNumberChanged() {
            setTimeout(() => this.facetsSettingsChanged(), 250)
        },
        onColumnAdded() {
            this.loadFacetsSettings()
        },
        onColumnRemoved() {
            this.loadFacetsSettings()
        }
    }
})
</script>
