<template>
    <q-dialog :model-value="visible" persistent>
        <q-card class="widget-title-dynamic-dialog">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ t(`dashboard.widgetEditor.editorTags.${mode}`) }}</q-toolbar-title>
            </q-toolbar>

            <q-card-section class="q-pa-none">
                <q-banner class="bg-blue-1 text-primary text-center q-ma-md">
                    {{ t(`dashboard.widgetEditor.editorTags.hint.${mode}`) }}
                </q-banner>

                <div v-if="mode === 'parameters'" class="q-ma-md">
                    <q-select v-model="selectedDriver" class="fit" :label="t('common.parameter')" :options="drivers" option-value="urlName" option-label="name" emit-value map-options filled />
                </div>

                <div v-else class="q-ma-md">
                    <q-select v-model="selectedVariable" class="fit" :label="t('common.variable')" :options="variables" option-label="name" filled />
                    <q-select v-if="variableKeys.length > 0" class="fit" v-model="variableKey" :label="t('common.key')" :options="variableKeys" filled />
                </div>
            </q-card-section>

            <q-card-actions align="right">
                <q-btn no-caps flat class="kn-button kn-button--secondary" @click="closeDialog">{{ t('common.cancel') }}</q-btn>
                <q-btn no-caps unelevated class="kn-button kn-button--primary" :disable="!forInsert" @click="addInsert">{{ t('common.add') }}</q-btn>
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { IDashboardDriver, IVariable } from '@/modules/documentExecution/dashboard/Dashboard'
import dashboardStore from '@/modules/documentExecution/dashboard/Dashboard.store'

const props = defineProps<{
    visible: boolean
    mode: 'parameters' | 'variables'
    variables: IVariable[]
    dashboardId: string
}>()

const emit = defineEmits<{
    close: []
    insert: [value: string]
}>()

const { t } = useI18n()
const store = dashboardStore()

const selectedDriver = ref('')
const selectedVariable = ref<IVariable | null>(null)
const variableKey = ref('')

const drivers = computed<IDashboardDriver[]>(() => store.getDashboardDrivers(props.dashboardId) ?? [])
const variableKeys = computed<string[]>(() => (selectedVariable.value?.pivotedValues ? Object.keys(selectedVariable.value.pivotedValues) : []))

const forInsert = computed(() => {
    if (props.mode === 'parameters') return selectedDriver.value ? `$P{${selectedDriver.value}}` : ''
    if (!selectedVariable.value) return ''
    if (selectedVariable.value.type !== 'dataset' || selectedVariable.value.column) return `$V{${selectedVariable.value.name}}`
    return variableKey.value ? `$V{${selectedVariable.value.name}.${variableKey.value}}` : ''
})

const resetSelection = () => {
    selectedDriver.value = ''
    selectedVariable.value = null
    variableKey.value = ''
}

const closeDialog = () => {
    resetSelection()
    emit('close')
}

const addInsert = () => {
    if (!forInsert.value) return
    emit('insert', forInsert.value)
}

watch(
    () => props.visible,
    () => {
        resetSelection()
    }
)

watch(
    () => props.mode,
    () => {
        resetSelection()
    }
)

watch(selectedVariable, () => {
    variableKey.value = ''
})
</script>

<style lang="scss" scoped>
.widget-title-dynamic-dialog {
    width: 60vw;
    max-width: 900px;
}
</style>
