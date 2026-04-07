<template>
    <div class="p-grid p-jc-center p-ai-center p-p-4">
        <template v-if="model">
            <div class="row items-center justify-between col-12 q-mb-sm kn-width-full">
                <span class="text-subtitle2">{{ $t('dashboard.widgetEditor.pivot.configuration.fieldPanelOptions.title') }}</span>
                <q-btn flat round dense color="primary" icon="add" :disable="!model.enabled" @click="addOverride" />
            </div>

            <div v-for="(override, index) in model.fieldDragOverrides" :key="override.id" class="col-12 field-drag-override-row q-mb-sm q-pa-sm kn-width-full">
                <div class="row q-gutter-sm items-start">
                    <q-select v-model="override.columns" :options="allFieldOptions" option-value="id" option-label="alias" emit-value map-options multiple dense outlined class="col" :label="$t('common.fields')" :disable="!model.enabled" />
                    <q-btn class="self-center" flat round dense icon="delete" :disable="!model.enabled" @click="removeOverride(index)" />
                </div>
                <div class="row q-mt-xs q-gutter-sm">
                    <q-checkbox v-model="override.disableDragging" :label="$t('dashboard.widgetEditor.pivot.configuration.fieldPanelOptions.disableDragging')" dense :disable="!model.enabled" />
                    <q-checkbox v-model="override.disableSorting" :label="$t('dashboard.widgetEditor.pivot.configuration.fieldPanelOptions.disableSorting')" dense :disable="!model.enabled" />
                    <q-checkbox v-model="override.disableFiltering" :label="$t('dashboard.widgetEditor.pivot.configuration.fieldPanelOptions.disableFiltering')" dense :disable="!model.enabled" />
                </div>
            </div>
        </template>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { IPivotFieldPanel, IPivotFieldDragOverride } from '@/modules/documentExecution/dashboard/interfaces/pivotTable/DashboardPivotTableWidget'
import { v4 as uuidv4 } from 'uuid'

export default defineComponent({
    name: 'pivot-table-field-panel',
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    computed: {
        model(): IPivotFieldPanel | null {
            return this.widgetModel.settings?.configuration?.fieldPanel ?? null
        },
        allFieldOptions(): { id: string; alias: string }[] {
            const fields = this.widgetModel.fields
            if (!fields) return []
            const axisFields: IWidgetColumn[] = [...(fields.columns ?? []), ...(fields.rows ?? [])]
            return axisFields.map((f) => ({ id: f.id as string, alias: f.alias }))
        }
    },
    methods: {
        addOverride() {
            if (!this.model) return
            if (!this.model.fieldDragOverrides) this.model.fieldDragOverrides = []
            const newOverride: IPivotFieldDragOverride = { id: uuidv4(), columns: [], disableDragging: false, disableSorting: false, disableFiltering: false }
            this.model.fieldDragOverrides.push(newOverride)
        },
        removeOverride(index: number) {
            this.model?.fieldDragOverrides?.splice(index, 1)
        }
    }
})
</script>

<style lang="scss" scoped>
.field-drag-override-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
}
</style>
