<template>
    <q-expansion-item default-opened expand-separator icon="edit_document" :label="$t('managers.scheduler.saveAsFile')">
        <q-card>
            <q-card-section>
                <div v-if="document">
                    <div class="row">
                        <q-input bottom-slots dense filled :rules="[(val) => val.length > 0 || $t('common.validation.required', { fieldName: $t('common.fileName') })]" v-model="document.fileName" @update:model-value="setFileNameValidation" :label="$t('common.fileName')" counter :maxlength="schedulerTimingOutputOutputTabDescriptor.accordion.file.nameMaxLength" class="col" />
                        <q-input bottom-slots dense filled v-model="document.destinationfolder" :label="$t('managers.scheduler.destinationFolder')" counter :maxlength="schedulerTimingOutputOutputTabDescriptor.accordion.file.destinationFolderMaxLength" class="col q-ml-sm">
                            <q-tooltip :delay="500">
                                {{ $t('managers.scheduler.destinationFolderHint') }}
                            </q-tooltip>
                        </q-input>
                    </div>
                    <div class="row">
                        <q-checkbox v-model="document.zipFileDocument" :label="$t('managers.scheduler.zipFileDocument')" />
                        <q-input v-if="document.zipFileDocument" bottom-slots dense filled v-model="document.zipFileName" :label="$t('managers.scheduler.zipFileName')" counter :maxlength="schedulerTimingOutputOutputTabDescriptor.accordion.file.zipFileNameMaxLength" class="col q-ml-sm" />
                    </div>
                </div>
            </q-card-section>
        </q-card>
    </q-expansion-item>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import schedulerTimingOutputOutputTabDescriptor from '../SchedulerTimingOutputOutputTabDescriptor.json'

export default defineComponent({
    name: 'scheduler-file-accordion',
    props: { propDocument: { type: Object }, functionalities: { type: Array }, datasets: { type: Array }, jobInfo: { type: Object } },
    data() {
        return {
            schedulerTimingOutputOutputTabDescriptor,
            document: null as any,
            fileNameDirty: false
        }
    },
    watch: {
        propDocument() {
            this.loadDocument()
        }
    },
    created() {
        this.loadDocument()
    },
    methods: {
        loadDocument() {
            this.document = this.propDocument
            this.document.invalid.invalidFile = false
            if (typeof this.document.zipFileDocument === 'undefined') this.document.zipFileDocument = false
            this.validateDocument()
        },
        setFileNameValidation() {
            this.fileNameDirty = true
            this.validateDocument()
        },
        validateDocument() {
            this.document.invalid.invalidFile = !this.document.fileName || this.document.fileName.length === 0
        }
    }
})
</script>

<style lang="scss" scoped>
#snapshot-name-container {
    flex: 2;
}

.name-help {
    font-size: smaller;
}
</style>
