<template>
    <Dialog style="width: 40vw" :header="$t('documentExecution.registry.warning')" :visible="visible" :modal="true" class="p-fluid kn-dialog--toolbar--primary" :closable="false">
        <div class="p-mt-5">
            <p>
                {{ $t('documentExecution.registry.dependsFromWarning', { column: columnTitle, dependsFrom: dependsFromTitle }) }}
            </p>
        </div>
        <div class="p-mt-3">
            <Checkbox v-model="dontShowAgain" :binary="true" />
            <label class="p-ml-2">{{ $t('documentExecution.registry.warningCheckbox') }}</label>
        </div>
        <template #footer>
            <Button class="kn-button kn-button--primary" @click="onClose">{{ $t('common.close') }}</Button>
        </template>
    </Dialog>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

const props = defineProps<{
    visible?: boolean
    columnTitle?: string
    dependsFromTitle?: string
}>()

const emit = defineEmits<{
    (e: 'close', payload: { dontShowAgain: boolean }): void
}>()

const dontShowAgain = ref(false)

watch(
    () => props.visible,
    (v) => { if (!v) dontShowAgain.value = false }
)

function onClose() {
    emit('close', { dontShowAgain: dontShowAgain.value })
}
</script>
