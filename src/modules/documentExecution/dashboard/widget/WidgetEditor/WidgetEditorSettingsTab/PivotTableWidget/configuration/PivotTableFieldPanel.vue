<template>
    <div v-if="model" class="q-px-md q-pb-md">
        <div class="row items-center justify-between q-mb-sm">
            <span class="text-subtitle2">{{ $t('dashboard.widgetEditor.pivot.configuration.fieldPanelOptions.title') }}</span>
            <q-btn flat round dense color="primary" icon="add" :disable="!model.enabled" @click="addOverride" />
        </div>

        <div v-for="(override, index) in model.fieldDragOverrides" :key="override.id" class="column-type-row row no-wrap q-mb-sm">
            <div class="col q-pa-sm">
                <div class="q-mb-sm">
                    <q-select v-model="override.columns" :options="allFieldOptions" option-value="id" option-label="alias" emit-value map-options multiple dense outlined :label="$t('common.fields')" :disable="!model.enabled" />
                </div>
                <div class="row q-gutter-sm">
                    <q-checkbox v-model="override.disableDragging" :label="$t('dashboard.widgetEditor.pivot.configuration.fieldPanelOptions.disableDragging')" dense :disable="!model.enabled" />
                    <q-checkbox v-model="override.disableSorting" :label="$t('dashboard.widgetEditor.pivot.configuration.fieldPanelOptions.disableSorting')" dense :disable="!model.enabled" />
                    <q-checkbox v-model="override.disableFiltering" :label="$t('dashboard.widgetEditor.pivot.configuration.fieldPanelOptions.disableFiltering')" dense :disable="!model.enabled" />
                </div>
            </div>
            <div class="kn-action-handle row items-center justify-center">
                <q-btn flat round dense icon="delete" size="sm" :disable="!model.enabled" @click="removeOverride(index)" />
            </div>
        </div>
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
.column-type-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}
</style>
