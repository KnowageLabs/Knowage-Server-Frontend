<template>
    <div class="col q-pa-md kn-width-full">
        <div v-for="(config, index) in columnDefaultValues" :key="config.columnName" class="row items-center q-gutter-sm q-mb-sm">
            <q-select class="col" :model-value="config.columnName" :options="columnOptions" option-value="columnName" option-label="alias" emit-value map-options dense outlined disable :label="$t('common.column')" />
            <q-select class="col" v-model="columnDefaultValues[index].valueType" :options="getDefaultValuesTypesForColumn()" option-value="value" option-label="label" emit-value map-options dense outlined :disable="!defaultValuesEnabled" :label="$t('dashboard.widgetEditor.defaultValues.selectDafaultValue')" @update:model-value="onValueTypeChanged(index)" />
            <q-input v-if="columnDefaultValues[index].valueType === 'STATIC'" class="col" v-model="columnDefaultValues[index].value" dense outlined :disable="!defaultValuesEnabled" :label="$t('common.value')" @update:model-value="defaultValuesChanged" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '../../../../../DashboardHelpers'
import descriptor from '../SelectorWidgetSettingsDescriptor.json'

interface IColumnDefaultValue {
    columnName: string
    valueType: '' | 'STATIC' | 'FIRST' | 'LAST'
    value: string
}

export default defineComponent({
    name: 'selector-widget-default-values',
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            columnDefaultValues: [] as IColumnDefaultValue[]
        }
    },
    computed: {
        isDateType(): boolean {
            return !!this.widgetModel?.settings?.isDateType
        },
        defaultValuesEnabled(): boolean {
            return !!this.widgetModel?.settings?.configuration?.defaultValues?.enabled
        },
        columnOptions(): { columnName: string; alias: string }[] {
            return (this.widgetModel.columns ?? []).map((c: any) => ({ columnName: c.columnName, alias: c.alias }))
        },
        translatedDefaultValuesTypes(): { label: string; value: string }[] {
            return this.descriptor.defaultValuesTypes.map((t) => ({
                label: t.label ? (this.$t(t.label) as string) : '',
                value: t.value
            }))
        }
    },
    watch: {
        isDateType() {
            this.columnDefaultValues.forEach((_, i) => {
                if (this.columnDefaultValues[i].valueType !== 'STATIC') {
                    this.onValueTypeChanged(i)
                }
            })
        },
        'widgetModel.columns'() {
            this.syncColumnDefaultValues()
        }
    },
    created() {
        this.loadDefaultValuesModel()
    },
    methods: {
        loadDefaultValuesModel() {
            const config = this.widgetModel.settings?.configuration?.defaultValues
            const existingColumns = config?.columns
            if (Array.isArray(existingColumns)) {
                this.columnDefaultValues = (this.widgetModel.columns ?? []).map((col: any) => {
                    const found = existingColumns.find((e: IColumnDefaultValue) => e.columnName === col.columnName)
                    return found ?? { columnName: col.columnName, valueType: '' as const, value: '' }
                })
            } else {
                this.columnDefaultValues = (this.widgetModel.columns ?? []).map((col: any) => ({
                    columnName: col.columnName,
                    valueType: '' as const,
                    value: ''
                }))
            }
            this.syncToModel()
        },
        syncColumnDefaultValues() {
            const existingMap = new Map(this.columnDefaultValues.map((c) => [c.columnName, c]))
            this.columnDefaultValues = (this.widgetModel.columns ?? []).map((col: any) => existingMap.get(col.columnName) ?? { columnName: col.columnName, valueType: '' as const, value: '' })
            this.syncToModel()
        },
        syncToModel() {
            const cfg = this.widgetModel.settings.configuration.defaultValues
            cfg.columns = this.columnDefaultValues
        },
        getDefaultValuesTypesForColumn(): { label: string; value: string }[] {
            if (this.isDateType) {
                return this.translatedDefaultValuesTypes.filter((t) => t.value === 'STATIC')
            }
            return this.translatedDefaultValuesTypes
        },
        defaultValuesChanged() {
            this.syncToModel()
            emitter.emit('defaultValuesChanged', this.widgetModel.id)
            emitter.emit('refreshSelector', this.widgetModel.id)
        },
        onValueTypeChanged(index: number) {
            if (this.columnDefaultValues[index].valueType !== 'STATIC') {
                this.columnDefaultValues[index].value = ''
            }
            this.defaultValuesChanged()
        }
    }
})
</script>
