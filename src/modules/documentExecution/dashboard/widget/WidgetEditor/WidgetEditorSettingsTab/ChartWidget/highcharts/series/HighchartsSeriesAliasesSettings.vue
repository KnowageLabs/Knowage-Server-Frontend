<template>
    <div v-if="widgetModel" class="q-px-md q-pb-sm">
        <div v-for="(aliasSettings, index) in chartAliasesSettings" :key="index" class="column-type-row row no-wrap q-mb-sm">
            <div class="kn-action-handle kn-action-handle-disabled"></div>
            <div class="col q-pa-sm">
                <div class="row q-col-gutter-sm">
                    <div class="col-6">
                        <q-select v-model="aliasSettings.column" :options="columnOptions" :label="$t('qbe.entities.types.measure')" option-label="columnName" outlined dense />
                    </div>
                    <div class="col-6">
                        <q-input v-model="aliasSettings.alias" :label="$t('common.alias')" outlined dense />
                    </div>
                </div>
            </div>
            <div class="kn-action-handle row items-center justify-center">
                <q-btn v-if="index === 0" flat round dense icon="add_circle" size="sm" @click="addAliasSettings()" />
                <q-btn v-else flat round dense icon="delete" size="sm" @click="removeAliasSettings(index)" />
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { IWidget, IWidgetColumn } from '@/modules/documentExecution/dashboard/Dashboard'
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'

const props = defineProps<{ propWidgetModel: IWidget }>()

const widgetModel = ref<IWidget | null>(null)
const chartAliasesSettings = ref<{ column: IWidgetColumn | null; alias: string }[]>([])

const columnOptions = computed(() => {
    return widgetModel.value?.columns?.filter((column: IWidgetColumn) => column.fieldType === 'MEASURE') || []
})

const setEventListeners = () => {
    emitter.on('seriesRemoved', loadAliasesSettings)
}

const removeEventListeners = () => {
    emitter.off('seriesRemoved', loadAliasesSettings)
}

const loadModel = () => {
    widgetModel.value = props.propWidgetModel
}

const loadAliasesSettings = () => {
    if (widgetModel.value?.settings?.series && !widgetModel.value?.settings.series.aliases) widgetModel.value.settings.series.aliases = [{ column: null, alias: '' }]
    chartAliasesSettings.value = widgetModel.value ? widgetModel.value.settings.series.aliases : []

    filterAvailableOptionsAfterWidgetColumnsChanged()
}

const filterAvailableOptionsAfterWidgetColumnsChanged = () => {
    const validColumns = columnOptions.value.map((col) => ({ id: col.id, name: col.columnName }))

    const filteredAliases = widgetModel.value ? widgetModel.value.settings.series.aliases.filter((alias: { column: IWidgetColumn | null; alias: string }) => !alias.column || validColumns.some((validCol) => alias.column?.id === validCol.id || alias.column?.columnName === validCol.name)) : []

    if (filteredAliases.length === 0) filteredAliases.push({ column: null, alias: '' })
    chartAliasesSettings.value = filteredAliases
    if (widgetModel.value) {
        widgetModel.value.settings.series.aliases = filteredAliases
    }
}

const addAliasSettings = () => {
    chartAliasesSettings.value.push({ column: null, alias: '' })
}

const removeAliasSettings = (index: number) => {
    chartAliasesSettings.value.splice(index, 1)
}

onMounted(() => {
    setEventListeners()
    loadModel()
    loadAliasesSettings()
})

onUnmounted(() => {
    removeEventListeners()
})
</script>

<style lang="scss" scoped>
.column-type-row {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}
</style>
