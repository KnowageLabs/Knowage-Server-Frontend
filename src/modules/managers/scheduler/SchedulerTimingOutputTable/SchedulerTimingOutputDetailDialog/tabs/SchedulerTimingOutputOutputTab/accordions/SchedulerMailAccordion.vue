<template>
    <q-expansion-item default-opened expand-separator icon="mail" :label="$t('managers.scheduler.sendMail')">
        <q-card>
            <q-card-section>
                <div v-if="document">
                    <div v-if="uniqueMailEnabledOnOtherDocument" class="row justify-center q-mt-md">
                        <q-banner rounded dense class="bg-info col-6 text-center">
                            <template v-slot:avatar>
                                <q-icon name="info" />
                            </template>
                            {{ $t('managers.scheduler.uniqueMailSelectedInfo') }}
                        </q-banner>
                    </div>

                    <div class="row">
                        <q-checkbox v-model="document.useFixedRecipients" :label="$t('managers.scheduler.fixedRecipientsList')" @update:model-value="removeDocumentExpressionAndDatasets" />
                        <q-input
                            v-if="document.useFixedRecipients"
                            bottom-slots
                            dense
                            filled
                            :rules="[(val) => val.length > 0 || $t('common.validation.required', { fieldName: $t('managers.scheduler.fixedRecipientsList') })]"
                            v-model="document.mailtos"
                            @update:model-value="validateDocument('fixedRecipientsListDirty')"
                            :label="$t('managers.scheduler.mailTo')"
                            counter
                            :maxlength="schedulerTimingOutputOutputTabDescriptor.accordion.mail.mailToMaxLength"
                            class="col q-ml-md"
                        >
                            <template #prepend>
                                <q-icon name="mail" />
                            </template>
                            <template #hint> TODO: Field hint </template>
                        </q-input>
                    </div>
                    <div class="row">
                        <q-checkbox v-model="document.useExpression" :label="$t('managers.scheduler.useExpression')" @update:model-value="removeDocumentFixedRecipientsAndDatasets" />
                        <q-input
                            v-if="document.useExpression"
                            bottom-slots
                            counter
                            @update:model-value="validateDocument('expressionDirty')"
                            :maxlength="schedulerTimingOutputOutputTabDescriptor.accordion.mail.expressionMaxLength"
                            :rules="[(val) => val.length > 0 || $t('common.validation.required', { fieldName: $t('managers.scheduler.expression') })]"
                            dense
                            filled
                            v-model="document.expression"
                            :label="$t('managers.scheduler.expression')"
                            class="col q-ml-md"
                        >
                            <template #prepend>
                                <q-icon name="code" />
                            </template>
                        </q-input>
                    </div>
                    <div class="row" v-show="!uniqueMailEnabledOnOtherDocument">
                        <q-checkbox v-model="document.uniqueMail" :label="$t('managers.scheduler.uniqueMail')" @update:model-value="onSendUniqueMailChanged" />
                    </div>

                    <div class="row">
                        <q-checkbox v-model="document.zipMailDocument" :label="$t('managers.scheduler.zipMailDocument')" @update:model-value="removeDocumentFixedRecipientsAndDatasets" />
                        <q-input
                            v-if="document.zipMailDocument"
                            bottom-slots
                            counter
                            :maxlength="schedulerTimingOutputOutputTabDescriptor.accordion.mail.zipMailNameMaxLength"
                            dense
                            filled
                            v-model="document.zipMailName"
                            @update:model-value="validateDocument(null)"
                            :label="$t('managers.scheduler.zipFileName')"
                            class="col q-ml-md"
                        >
                            <template #prepend>
                                <q-icon name="folder_zip" />
                            </template>
                        </q-input>
                    </div>

                    <div class="row">
                        <q-checkbox v-model="document.reportNameInSubject" :label="$t('managers.scheduler.reportNameInSubject')" @update:model-value="validateDocument(null)" />
                    </div>

                    <div class="row">
                        <q-checkbox v-model="document.useDataset" :label="$t('managers.scheduler.useDatasetList')" @update:model-value="removeDocumentFixedRecipientsAndExpression" />
                        <q-select v-if="document.useDataset" v-model="document.datasetLabel" :options="datasets" optionLabel="label" optionValue="label" dense filled :label="$t('managers.scheduler.datasetVerification')" class="col q-ml-md" />
                    </div>

                    <div class="row q-mt-md">
                        <q-input bottom-slots counter :maxlength="schedulerTimingOutputOutputTabDescriptor.accordion.mail.mailSubjectMaxLength" @update:model-value="validateDocument(null)" dense filled v-model="document.mailsubj" :label="$t('managers.scheduler.mailSubject')" class="col"> </q-input>
                        <q-input bottom-slots counter :maxlength="schedulerTimingOutputOutputTabDescriptor.accordion.mail.fileNameMaxLength" @update:model-value="validateDocument(null)" dense filled v-model="document.containedFileName" :label="$t('common.fileName')" class="col q-ml-md"> </q-input>
                    </div>

                    <q-input
                        class="q-mt-md"
                        dense
                        bottom-slots
                        counter
                        :maxlength="schedulerTimingOutputOutputTabDescriptor.accordion.mail.mailTextMaxLength"
                        v-model="document.mailtxt"
                        filled
                        @update:model-value="validateDocument(null)"
                        type="textarea"
                        :label="$t('managers.scheduler.mailText')"
                        :placeholder="$t('managers.scheduler.mailTextMessage')"
                    />
                </div>
            </q-card-section>
        </q-card>
    </q-expansion-item>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import schedulerTimingOutputOutputTabDescriptor from '../SchedulerTimingOutputOutputTabDescriptor.json'

export default defineComponent({
    name: 'scheduler-mail-accordion',
    props: { propDocument: { type: Object }, functionalities: { type: Array }, datasets: { type: Array }, jobInfo: { type: Object }, documentWithUniqueMail: { type: Object } },
    emits: ['sendUniqueMailSelected', 'uniqueMailOptionsChanged'],
    data() {
        return {
            schedulerTimingOutputOutputTabDescriptor,
            document: null as any,
            drivers: [],
            fixedRecipientsListDirty: false,
            expressionDirty: false,
            datasetLabelDirty: false,
            datasetParameterDirty: false
        }
    },
    computed: {
        uniqueMailEnabledOnOtherDocument(): boolean {
            return this.documentWithUniqueMail && this.propDocument?.id !== this.documentWithUniqueMail?.id && this.documentWithUniqueMail.uniqueMail
        }
    },
    watch: {
        propDocument() {
            this.loadData()
        }
    },
    created() {
        this.loadData()
    },
    methods: {
        loadData() {
            this.loadDocument()
            this.loadDrivers()
        },
        loadDocument() {
            this.document = this.propDocument
            if (!this.document.useFixedRecipients && !this.document.useExpression && !this.document.useDataset) {
                this.document.useFixedRecipients = false
                this.document.useExpression = false
                this.document.useDataset = false
            }
            if (typeof this.document.uniqueMail === 'undefined') this.document.uniqueMail = false
            if (typeof this.document.zipMailDocument === 'undefined') this.document.zipMailDocument = false
            if (typeof this.document.reportNameInSubject === 'undefined') this.document.reportNameInSubject = false

            this.document.invalid.invalidMail = false
            this.validateDocument(null)
        },
        loadDrivers() {
            const index = this.jobInfo?.documents.findIndex((el: any) => el.label === this.document.label)
            if (index !== -1) {
                this.drivers = this.jobInfo?.documents[index].parameters
            }
        },
        removeDocumentExpressionAndDatasets() {
            this.validateDocument(null)
            if (this.document.useFixedRecipients) {
                this.resetExpression()
                this.resetFolderDataset()
            }
        },
        removeDocumentFixedRecipientsAndDatasets() {
            this.validateDocument(null)
            if (this.document.useExpression) {
                this.resetFixedRecipients()
                this.resetFolderDataset()
            }
        },
        removeDocumentFixedRecipientsAndExpression() {
            this.validateDocument(null)
            if (this.document.useDataset) {
                this.resetFixedRecipients()
                this.resetExpression()
            } else {
                delete this.document.datasetLabel
            }
        },
        resetFixedRecipients() {
            if (this.document.useFixedRecipients) {
                this.document.useFixedRecipients = false
                delete this.document.mailtos
            }
        },
        resetExpression() {
            if (this.document.useExpression) {
                this.document.useExpression = false
                delete this.document.expression
            }
        },
        resetFolderDataset() {
            if (this.document.useDataset) {
                this.document.useDataset = false
                delete this.document.datasetLabel
                delete this.document.useDataset.datasetLabel
                delete this.document.useDataset.parameters
            }
        },
        validateDocument(dirty: string | null) {
            if (dirty) {
                this[dirty] = true
                this.uniqueMailChanged()
            }

            const fixedRecipientsListInvalid = this.document.useFixedRecipients && (!this.document.mailtos || (this.document.mailtos.length === 0 && !this.uniqueMailEnabledOnOtherDocument))
            const expressionInvalid = this.document.useExpression && (!this.document.expression || (this.document.expression.length === 0 && !this.uniqueMailEnabledOnOtherDocument))
            const datasetInvalid = this.document.useDataset && (!this.document.datasetLabel || this.document.datasetLabel?.length === 0 || !this.document.datasetParameter || this.document.datasetParameter?.length === 0) && !this.uniqueMailEnabledOnOtherDocument

            this.document.invalid.invalidMail = fixedRecipientsListInvalid || expressionInvalid || datasetInvalid
        },
        onSendUniqueMailChanged() {
            this.$emit('sendUniqueMailSelected', this.document)
        },
        uniqueMailChanged() {
            if (this.documentWithUniqueMail && this.document?.id === this.documentWithUniqueMail.id && this.documentWithUniqueMail.uniqueMail) this.$emit('uniqueMailOptionsChanged', this.documentWithUniqueMail)
        }
    }
})
</script>

<style lang="scss" scoped>
#snapshot-name-container {
    flex: 2;
}

.max-length-help {
    font-size: smaller;
}
</style>
