<template>
    <Dialog :style="registryDatatableWarningDialogDescriptor.dialog.style" :header="$t('documentExecution.registry.warning')" :visible="visible" :modal="true" class="p-fluid kn-dialog--toolbar--primary" :closable="false">
        <div class="p-mt-5">
            <p>
                {{ $t('documentExecution.registry.column') }}
                <b>{{ columnFileds }}</b>
                {{ $t('documentExecution.registry.warningDependences') }}
            </p>
        </div>
        <div class="p-mt-3">
            <Checkbox v-model="stopWarnings" :binary="true"></Checkbox>
            <label class="p-ml-2"> {{ $t('documentExecution.registry.warningCheckbox') }}</label>
        </div>
        <template #footer>
            <Button class="kn-button kn-button--primary" @click="$emit('close', { stopWarnings: stopWarnings, columnField: columns[0].dependences })"> {{ $t('common.close') }}</Button>
        </template>
    </Dialog>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import registryDatatableWarningDialogDescriptor from './RegistryDatatableWarningDialogDescriptor.json'

const props = defineProps<{
    visible?: boolean
    columns: any[]
}>()

const emit = defineEmits<{
    (e: 'close', payload: { stopWarnings: boolean; columnField: any }): void
}>()

const stopWarnings = ref(false)

const columnFileds = computed(() => {
    let fields = ''
    for (let i = 0; i < props.columns.length; i++) {
        fields += props.columns[i].title + (i === props.columns.length - 1 ? ' ' : ', ')
    }
    return fields
})
</script>
