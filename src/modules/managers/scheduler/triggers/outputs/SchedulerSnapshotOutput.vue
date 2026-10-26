<template>
    <div class="row q-col-gutter-sm">
        <div class="col-12 col-sm-6">
            <q-input v-model="document.snapshotname" outlined dense hide-bottom-space :readonly="readonly" :maxlength="descriptor.limits.snapshot.name" :label="$t('common.name') + ' *'" :error="!document.snapshotname" data-test="snapshot-name" />
        </div>
        <div class="col-12 col-sm-6">
            <q-input v-model="document.snapshothistorylength" outlined dense hide-bottom-space :readonly="readonly" type="number" min="1" :label="$t('managers.scheduler.historyLength')" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { iTriggerDocument } from '../../Scheduler'
import descriptor from '../../SchedulerDescriptor.json'

defineProps<{ document: iTriggerDocument; readonly?: boolean }>()
</script>
