<template>
    <div class="q-px-md q-pb-md">
        <div class="row items-center justify-between q-mb-sm col-12 kn-width-full">
            <span class="text-subtitle2">{{ $t('dashboard.widgetEditor.pivot.configuration.menuOverridesInfo') }}</span>
            <q-btn flat round dense color="primary" icon="add" @click="addOverride" />
        </div>

        <div v-for="(override, index) in overrides" :key="override.id" class="column-type-row row no-wrap q-mb-sm">
            <div class="col q-pa-sm">
                <div class="q-mb-sm">
                    <q-select v-model="override.columns" :options="allFieldOptions" option-value="id" option-label="alias" emit-value map-options multiple dense outlined :label="$t('common.fields')" />
                </div>
                <div class="row">
                    <q-checkbox v-model="override.disableExpandAll" :label="$t('dashboard.widgetEditor.pivot.configuration.disableExpandAll')" dense />
                </div>
            </div>
            <div class="kn-action-handle row items-center justify-center">
                <q-btn flat round dense icon="delete" size="sm" @click="removeOverride(index)" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { IPivotMenuOverride } from '@/modules/documentExecution/dashboard/interfaces/pivotTable/DashboardPivotTableWidget'
import { v4 as uuidv4 } from 'uuid'

export default defineComponent({
    name: 'pivot-table-menu-overrides',
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    computed: {
        overrides(): IPivotMenuOverride[] {
            if (!this.widgetModel.settings?.configuration?.menuOverrides) {
                this.widgetModel.settings.configuration.menuOverrides = []
            }
            return this.widgetModel.settings.configuration.menuOverrides
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
            const newOverride: IPivotMenuOverride = { id: uuidv4(), columns: [], disableExpandAll: true }
            this.widgetModel.settings.configuration.menuOverrides!.push(newOverride)
        },
        removeOverride(index: number) {
            this.widgetModel.settings.configuration.menuOverrides!.splice(index, 1)
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
