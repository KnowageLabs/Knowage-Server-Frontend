<template>
    <div class="row q-col-gutter-sm">
        <div class="col-12 col-sm-6">
            <q-input v-model="document.fileName" outlined dense hide-bottom-space :readonly="readonly" :maxlength="descriptor.limits.file.name" :label="$t('common.fileName') + ' *'" :error="!document.fileName" data-test="file-name" />
        </div>
        <div class="col-12 col-sm-6">
            <q-input v-model="document.destinationfolder" outlined dense hide-bottom-space :readonly="readonly" :maxlength="descriptor.limits.file.destinationFolder" :label="$t('managers.scheduler.destinationFolder')">
                <template #append>
                    <q-icon name="info" size="xs" class="kn-editor-card-hint">
                        <q-tooltip :delay="300">{{ $t('managers.scheduler.destinationFolderHint') }}</q-tooltip>
                    </q-icon>
                </template>
            </q-input>
        </div>
        <div class="col-12 col-sm-6 row items-center">
            <q-toggle v-model="document.zipFileDocument" dense :disable="readonly" :label="$t('managers.scheduler.zipFileDocument')" />
        </div>
        <div v-if="document.zipFileDocument" class="col-12 col-sm-6">
            <q-input v-model="document.zipFileName" outlined dense hide-bottom-space :readonly="readonly" :maxlength="descriptor.limits.file.zipFileName" :label="$t('managers.scheduler.zipFileName')" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { iTriggerDocument } from '../../Scheduler'
import descriptor from '../../SchedulerDescriptor.json'

defineProps<{ document: iTriggerDocument; readonly?: boolean }>()
</script>
