<template>
    <q-expansion-item default-opened expand-separator icon="save_as" :label="$t('managers.scheduler.saveAsDocument')">
        <q-card>
            <q-card-section>
                <div v-if="document">
                    <div class="row">
                        <q-input
                            bottom-slots
                            dense
                            filled
                            :rules="[(val) => val.length > 0 || $t('common.validation.required', { fieldName: $t('common.name') })]"
                            v-model="document.documentname"
                            @update:model-value="validateDocument('documentNameDirty')"
                            :label="$t('common.name')"
                            counter
                            :maxlength="schedulerTimingOutputOutputTabDescriptor.accordion.document.nameMaxLength"
                            class="col"
                        />
                        <q-input
                            bottom-slots
                            dense
                            filled
                            v-model="document.documentdescription"
                            @update:model-value="validateDocument('fixedRecipientsListDirty')"
                            :label="$t('common.description')"
                            counter
                            :maxlength="schedulerTimingOutputOutputTabDescriptor.accordion.document.descriptionMaxLength"
                            class="col q-ml-md"
                        />
                        <q-checkbox v-model="document.useFixedFolder" :label="$t('managers.scheduler.fixedFolder')" @update:model-value="validateDocument" />
                    </div>
                    <div v-if="document.useFixedFolder">
                        <SchedulerDocumentAccordionTree :prop-functionalities="functionalities" :prop-selected-folders="document.funct" @selected="setSelectedFolders"></SchedulerDocumentAccordionTree>
                    </div>
                    <div v-if="drivers.length > 0" class="p-m-2">
                        <div
                            v-tooltip="
                                `${$t('managers.scheduler.useFolderDatasetHint.partOne')}:
                            ${$t('managers.scheduler.useFolderDatasetHint.partTwo')} ${$t('managers.scheduler.useFolderDatasetHint.partThree')}`
                            "
                            class="p-my-4"
                        >
                            <q-checkbox v-model="document.useFolderDataset" :label="$t('managers.scheduler.folderFromDataset')" />
                        </div>

                        <div v-if="document.useFolderDataset" class="p-mt-4">
                            <div class="row">
                                <q-select v-model="document.datasetFolderLabel" @update:model-value="validateDocument('datasetFolderLabelDrity')" :options="datasets" optionLabel="label" optionValue="label" dense filled :label="$t('managers.scheduler.datasetVerification')" class="col" />
                                <q-select v-model="document.datasetFolderParameter" @update:model-value="validateDocument('datasetFolderParameterDirty')" :options="drivers" optionLabel="label" optionValue="label" dense filled :label="$t('common.driver')" class="col q-ml-md" />
                            </div>
                        </div>
                    </div>
                </div>
            </q-card-section>
        </q-card>
    </q-expansion-item>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import SchedulerDocumentAccordionTree from './SchedulerDocumentAccordionTree.vue'
import schedulerTimingOutputOutputTabDescriptor from '../SchedulerTimingOutputOutputTabDescriptor.json'

export default defineComponent({
    name: 'scheduler-document-accordion',
    components: { SchedulerDocumentAccordionTree },
    props: { propDocument: { type: Object }, functionalities: { type: Array }, datasets: { type: Array }, jobInfo: { type: Object } },
    data() {
        return {
            schedulerTimingOutputOutputTabDescriptor,
            document: null as any,
            drivers: [],
            documentNameDirty: false,
            datasetFolderLabelDrity: false,
            datasetFolderParameterDirty: false
        }
    },
    watch: {
        propDocument() {
            this.loadDocument()
            this.loadDrivers()
        }
    },
    created() {
        this.loadDocument()
        this.loadDrivers()
    },
    methods: {
        loadDocument() {
            this.document = this.propDocument

            this.document.invalid.invalidDocument = false
            if (typeof this.document.useFixedFolder === 'undefined') this.document.useFixedFolder = false

            this.validateDocument(null)
        },
        loadDrivers() {
            const index = this.jobInfo?.documents.findIndex((el: any) => el.label === this.document.label)
            if (index !== -1) {
                this.drivers = this.jobInfo?.documents[index].parameters
            }
        },
        setSelectedFolders(folders: any[]) {
            this.document.funct = folders
            this.validateDocument(null)
        },
        validateDocument(dirty: string | null) {
            if (dirty) {
                this[dirty] = true
            }
            const nameInvalid = !this.document.documentname || this.document.documentname.length === 0
            const datasetInvalid = this.document.useFolderDataset && (!this.document.datasetFolderLabel || this.document.datasetFolderLabel?.length === 0 || !this.document.datasetFolderParameter || this.document.datasetFolderParameter?.length === 0)
            const foldersInvalid = this.document.useFixedFolder && (!this.document.funct || this.document.funct?.length === 0)

            this.document.invalid.invalidDocument = nameInvalid || datasetInvalid || foldersInvalid
        }
    }
})
</script>

<style lang="scss" scoped>
.dataset-hint-list {
    list-style: none;
    margin: 0;
}

.name-help {
    font-size: smaller;
}
</style>
