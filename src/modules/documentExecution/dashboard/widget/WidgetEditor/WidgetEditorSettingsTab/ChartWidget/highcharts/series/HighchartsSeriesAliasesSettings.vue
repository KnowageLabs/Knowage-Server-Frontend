<template>
    <div v-if="widgetModel" class="p-grid p-jc-center p-ai-center p-p-4">
        <div v-for="(aliasSettings, index) in chartAliasesSettings" :key="index" class="dynamic-form-item p-grid p-col-12 p-ai-center">
            <div class="p-col-12 p-md-6 p-d-flex p-flex-column kn-flex">
                <q-select v-model="aliasSettings.column" :options="columnOptions" :label="$t('qbe.entities.types.measure')" option-label="columnName" />
            </div>
            <div class="p-col-11 p-md-5 p-d-flex p-flex-column kn-flex">
                <q-input v-model="aliasSettings.alias" :label="$t('common.alias')" />
            </div>
            <div class="p-col-1 p-d-flex p-flex-row p-jc-center p-ai-center p-pl-2">
                <i v-if="index === 0" :class="'pi pi-plus-circle'" class="kn-cursor-pointer p-ml-2 p-mt-4" @click="addAliasSettings()"></i>
                <i :class="'pi pi-trash'" class="kn-cursor-pointer p-ml-2 p-mt-4" @click="removeAliasSettings(index)"></i>
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
