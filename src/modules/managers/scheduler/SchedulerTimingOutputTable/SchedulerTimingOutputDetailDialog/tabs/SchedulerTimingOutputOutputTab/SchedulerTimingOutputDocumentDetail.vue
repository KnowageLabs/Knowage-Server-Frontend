<template>
    <div>
        <div id="top-container" class="p-grid p-p-2">
            <div class="p-md-12 p-lg-6 p-d-flex p-flex-row p-ai-center p-p-2">
                <div>
                    <q-checkbox v-model="document.saveassnapshot" :label="$t('managers.scheduler.saveAsSnapshot')" @change="removeProperty('saveassnapshot')" data-test="snapshot-checkbox" />
                </div>
                <div>
                    <q-checkbox v-model="document.saveasfile" :label="$t('managers.scheduler.saveAsFile')" @change="removeProperty('saveasfile')" data-test="file-checkbox" />
                </div>
                <div>
                    <q-checkbox v-model="document.saveasdocument" :label="$t('managers.scheduler.saveAsDocument')" @change="removeProperty('saveasdocument')" data-test="document-checkbox" />
                </div>
                <div>
                    <q-checkbox v-model="document.sendtojavaclass" :label="$t('managers.scheduler.sendToJavaClass')" @change="removeProperty('sendtojavaclass')" data-test="java-checkbox" />
                </div>
                <div>
                    <q-checkbox v-model="document.sendmail" :label="$t('managers.scheduler.sendMail')" @change="removeProperty('sendmail')" data-test="mail-checkbox" />
                </div>
            </div>
            <div class="p-md-12 p-lg-6 p-px-5">
                <span>
                    <label class="kn-material-input-label">{{ $t('managers.widgetGallery.outputType') }}</label>
                    <Dropdown v-model="document.outputType" class="kn-material-input" :options="descriptor.documentOutputTypes" option-value="value" option-label="label" />
                </span>
            </div>
        </div>

        <div v-if="document">
            <SchedulerSnapshotAccordion v-if="document.saveassnapshot" class="p-m-3" :propDocument="document" data-test="snapshot-accordion"></SchedulerSnapshotAccordion>
            <SchedulerFileAccordion v-if="document.saveasfile" class="p-m-3" :propDocument="document" data-test="file-accordion"></SchedulerFileAccordion>
            <SchedulerDocumentAccordion v-if="document.saveasdocument" class="p-m-3" :propDocument="document" :functionalities="functionalities" :datasets="datasets" :jobInfo="jobInfo" data-test="document-accordion"></SchedulerDocumentAccordion>
            <SchedulerJavaClassAccordion v-if="document.sendtojavaclass" class="p-m-3" :propDocument="document" data-test="java-accordion"></SchedulerJavaClassAccordion>
            <SchedulerMailAccordion
                v-if="document.sendmail"
                class="p-m-3"
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

<style lang="scss" scoped>
#top-container {
    width: 95%;
}
</style>
