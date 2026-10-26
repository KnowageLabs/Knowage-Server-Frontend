<template>
    <q-dialog :model-value="modelValue" @update:model-value="(value) => emit('update:modelValue', value)">
        <q-card class="scheduler-info-dialog column no-wrap">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ $t('managers.scheduler.schedulationInformations') }}</q-toolbar-title>
                <q-btn v-close-popup flat round dense icon="close" />
            </q-toolbar>
            <q-card-section v-if="trigger" class="col scroll">
                <SchedulerTriggerReview :trigger="trigger" :datasets="datasets" readonly />
            </q-card-section>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import SchedulerTriggerReview from './SchedulerTriggerReview.vue'

defineProps<{ modelValue: boolean; trigger: any; datasets?: any[] }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()
</script>

<style scoped lang="scss">
.scheduler-info-dialog {
    width: 640px;
    max-width: 90vw;
    max-height: 80vh;
}
</style>
