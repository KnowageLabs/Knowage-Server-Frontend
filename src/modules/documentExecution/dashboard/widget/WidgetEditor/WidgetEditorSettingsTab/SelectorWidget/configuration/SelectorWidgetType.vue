<template>
    <div v-if="model && model.type == 'selector'" class="col q-pa-md kn-width-full">
        <!-- ================================================
             Legacy TypeCard config (single-column widgets)
             ================================================
        <div class="p-grid p-mx-2">
            <TypeCard v-for="(type, index) of selectorTypes" :key="index" :widget-model="model" :selector-type="type" />
        </div>
        <div v-if="showAlignment" class="p-d-flex p-flex-row p-m-2">
            <div v-for="(layout, index) of descriptor.layouts" :key="index" class="p-m-2">
                <RadioButton v-model="model.settings.configuration.selectorType.alignment" :input-id="layout.name" :name="layout.name" :value="layout.value" />
                <i :class="layout.icon" class="p-mx-2" />
                <label :for="layout.name">{{ layout.name }}</label>
            </div>
        </div>
        <span v-if="showGridColumnSize" class="p-float-label">
            <InputText id="colSize" v-model="model.settings.configuration.selectorType.columnSize" class="kn-material-input kn-width-full" />
            <label for="colSize" class="kn-material-input-label"> {{ $t('dashboard.widgetEditor.valuesManagement.colNumber') }} </label>
        </span>
        -->

        <div class="col-12">
            <q-select v-model="model.settings.configuration.selectorType.modality" :options="selectorTypeOptions" :label="$t('dashboard.widgetEditor.selectorWidget.type')" option-value="value" option-label="label" emit-value map-options dense outlined />
            <div v-if="showAlignment" class="col-12 row">
                <q-radio v-for="layout in descriptor.layouts" :key="layout.value" v-model="model.settings.configuration.selectorType.alignment" :val="layout.value" :label="layout.name" />
                <q-input v-if="showGridColumnSize" class="q-ml-md" v-model="model.settings.configuration.selectorType.columnSize" dense :label="$t('dashboard.widgetEditor.valuesManagement.colNumber')" />
            </div>
        </div>

        <q-separator class="q-my-md q-pa-none" />

        <div class="row items-center justify-between q-mb-sm">
            <span class="text-subtitle2">{{ $t('dashboard.widgetEditor.selectorWidget.typeOverrides') }}</span>
            <q-btn flat round dense color="primary" icon="add" @click="addColumnTypeConfig" />
        </div>

        <div v-for="(config, index) in columnTypeConfigs" :key="config.id" class="column column-type-row q-mb-sm q-pa-sm">
            <div class="row q-gutter-sm items-start">
                <q-select v-model="config.columns" :options="columnOptions" option-value="columnName" option-label="alias" emit-value map-options multiple dense outlined class="col" :label="$t('common.columns')" />
                <q-select v-model="config.selectorType" :options="selectorTypeOptions" option-value="value" option-label="label" emit-value map-options dense outlined class="col" :label="$t('dashboard.widgetEditor.selectorWidget.type')" />
                <q-btn class="p-as-center" flat round dense color="primary" icon="delete" @click="removeColumnTypeConfig(index)" />
            </div>
            <div v-if="supportsAlignment(config.selectorType)" class="row items-center">
                <q-radio v-for="layout in descriptor.layouts" :key="layout.value" v-model="config.alignment" :val="layout.value" :label="layout.name" />
                <q-input v-if="showGridColumnSize" class="q-ml-md" v-model="config.columnSize" dense :label="$t('dashboard.widgetEditor.valuesManagement.colNumber')" />
            </div>
        </div>
    </div>

    <div v-if="model && model.type == 'selection'" class="p-m-2">
        <div class="p-grid p-mx-2">
            <TypeCard v-for="(type, index) of selectionTypes" :key="index" :widget-model="model" :selector-type="type" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { ISelectorColumnTypeConfig, SelectorModality } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import TypeCard from './SelectorWidgetTypeCard.vue'
import descriptor from './SelectorWidgetDescriptor.json'
import { v4 as uuidv4 } from 'uuid'

const ALIGNMENT_TYPES: SelectorModality[] = ['singleValue', 'multiValue', 'dateRange']

export default defineComponent({
    name: 'selector-widget-type',
    components: { TypeCard },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            model: {} as IWidget,
            selectorTypes: [] as { imageUrl: string; label: string; value: string }[],
            selectionTypes: [] as { imageUrl: string; label: string; value: string }[]
        }
    },
    computed: {
        showAlignment(): boolean {
            const modality = this.model.settings?.configuration?.selectorType?.modality
            return ALIGNMENT_TYPES.includes(modality as SelectorModality)
        },
        selectorTypeOptions(): { label: string; value: string }[] {
            return this.descriptor.selectorTypes.map((t) => ({ label: t.label, value: t.value }))
        },
        showGridColumnSize(): boolean {
            const cfg = this.model.settings?.configuration?.selectorType
            return cfg?.alignment === 'grid' && (cfg?.modality === 'multiValue' || cfg?.modality === 'singleValue')
        },
        columnOptions(): { columnName: string; alias: string }[] {
            return (this.model.columns ?? []).map((c: any) => ({ columnName: c.columnName, alias: c.alias }))
        },
        columnTypeConfigs(): ISelectorColumnTypeConfig[] {
            if (!this.model.settings?.configuration) return []
            if (!this.model.settings.configuration.columnTypeConfigs) {
                this.model.settings.configuration.columnTypeConfigs = []
            }
            return this.model.settings.configuration.columnTypeConfigs
        }
    },
    watch: {
        widgetModel() {
            this.loadModel()
        }
    },
    created() {
        this.loadModel()
        this.loadSelectorTypes()
        this.loadSelectionTypes()
    },
    methods: {
        loadModel() {
            this.model = this.widgetModel
        },
        loadSelectorTypes() {
            this.selectorTypes = this.descriptor.selectorTypes.map((type) => {
                return { imageUrl: `${import.meta.env.VITE_KNOWAGE_VUE_CONTEXT}${type.imageUrl}`, label: type.label, value: type.value }
            })
        },
        loadSelectionTypes() {
            this.selectionTypes = this.descriptor.selectionTypes.map((type) => {
                return { imageUrl: `${import.meta.env.VITE_KNOWAGE_VUE_CONTEXT}${type.imageUrl}`, label: type.label, value: type.value }
            })
        },
        supportsAlignment(selectorType: SelectorModality): boolean {
            return ALIGNMENT_TYPES.includes(selectorType)
        },
        addColumnTypeConfig() {
            if (!this.model.settings?.configuration) return
            if (!this.model.settings.configuration.columnTypeConfigs) {
                this.model.settings.configuration.columnTypeConfigs = []
            }
            const newConfig: ISelectorColumnTypeConfig = {
                id: uuidv4(),
                columns: [],
                selectorType: 'singleValue',
                alignment: 'vertical',
                columnSize: ''
            }
            this.model.settings.configuration.columnTypeConfigs.push(newConfig)
        },
        removeColumnTypeConfig(index: number) {
            this.model.settings?.configuration?.columnTypeConfigs?.splice(index, 1)
        }
    }
})
</script>

<style lang="scss" scoped>
.column-type-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
}
</style>
