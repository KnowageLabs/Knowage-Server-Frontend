<template>
    <div>
        <div v-if="document.engine != 'knowagetalendengine'" id="top-container" class="row">
            <div class="p-md-12 p-lg-6 p-d-flex p-flex-row p-ai-center p-p-2">
                <q-checkbox v-model="document.saveassnapshot" class="ellipsis-2-lines" :label="$t('managers.scheduler.saveAsSnapshot')" data-test="snapshot-checkbox" />
                <q-checkbox v-model="document.saveasfile" class="ellipsis-2-lines" :label="$t('managers.scheduler.saveAsFile')" data-test="file-checkbox" />
                <q-checkbox v-model="document.saveasdocument" class="ellipsis-2-lines" :label="$t('managers.scheduler.saveAsDocument')" data-test="document-checkbox" />
                <!--q-checkbox v-model="document.sendtojavaclass" class="ellipsis-2-lines" :label="$t('managers.scheduler.sendToJavaClass')" @change="removeProperty('sendtojavaclass')" data-test="java-checkbox" /-->
                <q-checkbox v-model="document.sendmail" class="ellipsis-2-lines" :label="$t('managers.scheduler.sendMail')" data-test="mail-checkbox" />
            </div>
            <div class="p-md-12 p-lg-6 p-px-5">
                <q-select filled dense v-model="document.outputType" :options="descriptor.documentOutputTypes" emit-value map-options option-value="value" option-label="label" :label="$t('managers.widgetGallery.outputType')" />
            </div>
        </div>
        <div v-else class="row justify-center q-mt-md">
            <q-banner rounded dense class="bg-info col-6 text-center">
                <template v-slot:avatar>
                    <q-icon name="info" />
                </template>
                {{ $t('managers.scheduler.talendWarning') }}
            </q-banner>
        </div>

        <div v-if="document && document.engine != 'knowagetalendengine'" class="q-pa-sm">
            <SchedulerSnapshotAccordion v-if="document.saveassnapshot" class="q-ma-sm" :propDocument="document" data-test="snapshot-accordion"></SchedulerSnapshotAccordion>
            <SchedulerFileAccordion v-if="document.saveasfile" class="q-ma-sm" :propDocument="document" data-test="file-accordion"></SchedulerFileAccordion>
            <SchedulerDocumentAccordion v-if="document.saveasdocument" class="q-ma-sm" :propDocument="document" :functionalities="functionalities" :datasets="datasets" :jobInfo="jobInfo" data-test="document-accordion"></SchedulerDocumentAccordion>
            <!--SchedulerJavaClassAccordion v-if="document.sendtojavaclass" class="p-m-3" :propDocument="document" data-test="java-accordion"></SchedulerJavaClassAccordion-->
            <SchedulerMailAccordion
                v-if="document.sendmail"
                class="q-ma-sm"
                :propDocument="document"
                :datasets="datasets"
                :jobInfo="jobInfo"
                :documentWithUniqueMail="documentWithUniqueMail"
                @sendUniqueMailSelected="setSetUniqueMailSelected"
                @uniqueMailOptionsChanged="$emit('uniqueMailOptionsChanged', $event)"
                data-test="mail-accordion"
            ></SchedulerMailAccordion>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Checkbox from 'primevue/checkbox'
import SchedulerSnapshotAccordion from './accordions/SchedulerSnapshotAccordion.vue'
import SchedulerFileAccordion from './accordions/SchedulerFileAccordion.vue'
import SchedulerDocumentAccordion from './accordions/SchedulerDocumentAccordion.vue'
import SchedulerJavaClassAccordion from './accordions/SchedulerJavaClassAccordion.vue'
import SchedulerMailAccordion from './accordions/SchedulerMailAccordion.vue'
import descriptor from './SchedulerTimingOutputOutputTabDescriptor.json'
import Dropdown from 'primevue/dropdown'

export default defineComponent({
    name: 'scheduler-tming-output-document-detail',
    components: { Checkbox, SchedulerSnapshotAccordion, SchedulerFileAccordion, SchedulerJavaClassAccordion, SchedulerDocumentAccordion, SchedulerMailAccordion, Dropdown },
    props: { propDocument: { type: Object }, functionalities: { type: Array }, datasets: { type: Array }, jobInfo: { type: Object }, documentWithUniqueMail: { type: Object } },
    emits: ['sendUniqueMailSelected', 'uniqueMailOptionsChanged'],
    data() {
        return {
            descriptor,
            document: null as any
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
            this.formatDocument()
        },
        formatDocument() {
            if (!this.document.outputType) this.document.outputType = 'HTML'
            if (this.document.uniqueMail) this.setSetUniqueMailSelected(this.document)

            if (this.document.saveassnapshot == undefined) this.document.saveassnapshot = false
            if (this.document.saveasfile == undefined) this.document.saveasfile = false
            if (this.document.saveasdocument == undefined) this.document.saveasdocument = false
            if (this.document.sendtojavaclass == undefined) this.document.sendtojavaclass = false
            if (this.document.sendmail == undefined) this.document.sendmail = false

            this.document.invalid = {}
        },
        removeProperty(propName: string) {
            if (!this.document[propName]) {
                delete this.document[propName]
            }

            if (this.document.invalid) {
                this.resetInvalid(propName)
            }
        },
        resetInvalid(propName: string) {
            switch (propName) {
                case 'saveassnapshot':
                    this.document.invalid.invalidSnapshot = false
                    break
                case 'saveasfile':
                    this.document.invalid.invalidFile = false
                    break
                case 'saveasdocument':
                    this.document.invalid.invalidDocument = false
                    break
                case 'sendtojavaclass':
                    this.document.invalid.invalidJavaClass = false
                    break
                case 'sendmail':
                    this.document.invalid.invalidMail = false
            }
        },
        setSetUniqueMailSelected(document: any) {
            this.$emit('sendUniqueMailSelected', document)
        }
    }
})
</script>
