<template>
    <div class="scheduler-outputs" data-tour-id="scheduler-trigger-outputs">
        <q-tabs :model-value="activeLabelId" dense align="left" outside-arrows mobile-arrows no-caps active-color="primary" indicator-color="primary" class="scheduler-outputs__tabs" @update:model-value="(value) => emit('update:activeLabelId', value)">
            <q-tab v-for="(document, index) in documents" :key="document.labelId" :name="document.labelId" :ripple="false" data-test="document-tab">
                <div class="row items-center no-wrap">
                    <span class="scheduler-outputs__dot q-mr-sm" :class="states[index].valid ? 'scheduler-outputs__dot--ok' : 'scheduler-outputs__dot--error'"></span>
                    <span>{{ document.label }}</span>
                    <q-icon v-for="kind in states[index].enabledKinds" :key="kind" :name="OUTPUT_ICONS[kind]" size="15px" class="scheduler-outputs__tab-icon q-ml-xs" />
                </div>
            </q-tab>
        </q-tabs>
        <q-separator />

        <template v-if="current && currentState">
            <q-banner v-if="currentState.isTalend" dense rounded class="bg-blue-1 q-mt-md">
                <template #avatar><q-icon name="info" color="info" /></template>
                {{ $t('managers.scheduler.talendWarning') }}
            </q-banner>

            <template v-else>
                <div class="row items-center no-wrap q-py-sm q-mt-xs">
                    <span class="kn-editor-card-label q-mr-md">{{ $t('managers.scheduler.format') }}</span>
                    <q-btn-toggle v-model="current.outputType" no-caps unelevated dense toggle-color="primary" color="white" text-color="grey-9" class="scheduler-outputs__toggle" :options="formatOptions" />
                    <q-space />
                    <q-btn v-if="currentState.enabledKinds.length > 0" flat dense no-caps size="sm" :icon="allOpen ? 'unfold_less' : 'unfold_more'" :label="allOpen ? $t('managers.scheduler.collapseAll') : $t('managers.scheduler.expandAll')" @click="toggleAll" />
                </div>

                <q-expansion-item v-for="kind in OUTPUT_KINDS" :key="kind" :model-value="isEnabled(kind) && openOutputs[kind]" :hide-expand-icon="!isEnabled(kind)" class="scheduler-outputs__section" :class="{ 'scheduler-outputs__section--off': !isEnabled(kind) }" :data-test="'output-section-' + kind" @update:model-value="(value) => isEnabled(kind) && (openOutputs[kind] = value)">
                    <template #header>
                        <q-item-section side class="q-pr-sm">
                            <q-toggle :model-value="isEnabled(kind)" dense :data-test="'output-toggle-' + kind" @click.stop @update:model-value="(value) => setOutput(kind, value)" />
                        </q-item-section>
                        <q-item-section avatar class="scheduler-outputs__section-icon">
                            <q-icon :name="OUTPUT_ICONS[kind]" />
                        </q-item-section>
                        <q-item-section>
                            <div class="row items-center no-wrap">
                                <span class="text-weight-medium">{{ $t(OUTPUT_LABELS[kind]) }}</span>
                                <q-icon v-if="isEnabled(kind)" :name="currentState.errors[kind].length > 0 ? 'error' : 'check_circle'" :color="currentState.errors[kind].length > 0 ? 'negative' : 'positive'" size="18px" class="q-ml-xs" />
                            </div>
                        </q-item-section>
                        <q-item-section side>
                            <q-btn v-if="kind === 'mail' && isEnabled(kind) && !currentState.inheritedFrom && documents.length > 1" flat dense no-caps size="sm" icon="content_copy" :label="$t('managers.scheduler.copyToAll')" data-test="copy-to-all" @click.stop="copyMailToAll" />
                            <span v-else-if="!isEnabled(kind)" class="text-grey-6 text-caption">{{ $t('managers.scheduler.off') }}</span>
                        </q-item-section>
                    </template>

                    <div class="scheduler-outputs__form">
                        <SchedulerSnapshotOutput v-if="kind === 'snapshot'" :document="current" />
                        <SchedulerFileOutput v-else-if="kind === 'file'" :document="current" />
                        <SchedulerDocumentOutput v-else-if="kind === 'document'" :document="current" :functionalities="functionalities" :datasets="datasets" :job-info="jobInfo" />
                        <template v-else>
                            <q-banner v-if="currentState.inheritedFrom" dense rounded class="bg-blue-1 q-mb-sm">
                                <template #avatar><q-icon name="info" color="info" /></template>
                                {{ $t('managers.scheduler.uniqueMailInherited', { document: currentState.inheritedFrom.label }) }}
                                <template #action>
                                    <q-btn flat dense no-caps color="primary" :label="$t('managers.scheduler.editIn', { document: currentState.inheritedFrom.label })" @click="editUniqueMailDocument" />
                                </template>
                            </q-banner>
                            <SchedulerMailOutput :document="current" :datasets="datasets" :readonly="!!currentState.inheritedFrom" @unique-mail-change="applyUniqueMailChange(trigger, current)" />
                        </template>
                        <div v-if="currentState.errors[kind].length > 0" class="scheduler-outputs__missing row no-wrap items-center q-mt-sm">
                            <q-icon name="error_outline" size="16px" class="q-mr-xs" />
                            {{ $t('managers.scheduler.missing', { fields: currentState.errors[kind].map((key) => $t(key)).join(', ') }) }}
                        </div>
                    </div>
                </q-expansion-item>
                <div v-if="currentState.noOutput" class="scheduler-outputs__missing row no-wrap items-center q-mt-sm">
                    <q-icon name="error_outline" size="16px" class="q-mr-xs" />
                    {{ $t('managers.scheduler.noOutput') }}
                </div>
            </template>

            <div v-if="documents.length > 1" class="scheduler-outputs__footer row items-center no-wrap">
                <span class="col text-grey-7 text-caption">{{ $t('managers.scheduler.documentOf', { i: currentIndex + 1, n: documents.length }) }}</span>
                <q-btn v-if="currentIndex > 0" flat dense no-caps size="sm" icon="chevron_left" :label="documents[currentIndex - 1].label" @click="emit('update:activeLabelId', documents[currentIndex - 1].labelId as string)" />
                <q-btn v-if="currentIndex < documents.length - 1" flat dense no-caps size="sm" icon-right="chevron_right" :label="documents[currentIndex + 1].label" class="q-ml-xs" @click="emit('update:activeLabelId', documents[currentIndex + 1].labelId as string)" />
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { iFunctionality, iJobInfo, iTriggerDocument, iTriggerDraft, OutputKind } from '../Scheduler'
import { applyOutputDefaults, applyUniqueMailChange, copyMailSettings, getDocumentState, getUniqueMailDocument, OUTPUT_FLAGS, OUTPUT_ICONS, OUTPUT_KINDS, OUTPUT_LABELS } from '../schedulerHelpers'
import SchedulerSnapshotOutput from './outputs/SchedulerSnapshotOutput.vue'
import SchedulerFileOutput from './outputs/SchedulerFileOutput.vue'
import SchedulerDocumentOutput from './outputs/SchedulerDocumentOutput.vue'
import SchedulerMailOutput from './outputs/SchedulerMailOutput.vue'

const MAIL_FIELDS = ['useFixedRecipients', 'mailtos', 'useDataset', 'datasetLabel', 'datasetParameter', 'useExpression', 'zipMailDocument', 'reportNameInSubject', 'mailsubj', 'containedFileName', 'mailtxt'] as const

const props = defineProps<{ trigger: iTriggerDraft; activeLabelId: string; openOutputs: Record<OutputKind, boolean>; jobInfo?: iJobInfo | null; functionalities?: iFunctionality[]; datasets?: any[] }>()
const emit = defineEmits<{ (e: 'update:activeLabelId', value: string): void }>()

const { t } = useI18n()
const $q = useQuasar()

const formatOptions = [
    { value: 'PDF', label: 'PDF', icon: 'picture_as_pdf' },
    { value: 'XLS', label: 'XLS', icon: 'grid_on' }
]

const documents = computed(() => props.trigger.documents ?? [])
const states = computed(() => documents.value.map((document: iTriggerDocument) => getDocumentState(document, props.trigger, { jobInfo: props.jobInfo })))
const currentIndex = computed(() =>
    Math.max(
        0,
        documents.value.findIndex((document: iTriggerDocument) => document.labelId === props.activeLabelId)
    )
)
const current = computed(() => documents.value[currentIndex.value] ?? null)
const currentState = computed(() => states.value[currentIndex.value] ?? null)
const allOpen = computed(() => !!currentState.value && currentState.value.enabledKinds.every((kind: OutputKind) => props.openOutputs[kind]))

// A change in the unique-mail document updates the copies; the load does not start it
watch(
    () => {
        const uniqueMailDocument = getUniqueMailDocument(props.trigger)
        return uniqueMailDocument ? JSON.stringify([uniqueMailDocument.labelId, ...MAIL_FIELDS.map((field) => uniqueMailDocument[field])]) : null
    },
    (value, oldValue) => {
        const uniqueMailDocument = getUniqueMailDocument(props.trigger)
        if (!value || !oldValue || !uniqueMailDocument) return
        documents.value.forEach((document: iTriggerDocument) => {
            if (document.labelId !== uniqueMailDocument.labelId && document.sendmail) copyMailSettings(uniqueMailDocument, document)
        })
    }
)

function isEnabled(kind: OutputKind) {
    return !!current.value?.[OUTPUT_FLAGS[kind]]
}

// Turning an output on opens its section; turning it off keeps the open state of the type (D7)
function setOutput(kind: OutputKind, value: boolean) {
    const document = current.value
    if (!document) return
    document[OUTPUT_FLAGS[kind]] = value
    if (!value) return
    applyOutputDefaults(document, kind)
    props.openOutputs[kind] = true
    if (kind === 'mail') {
        const uniqueMailDocument = getUniqueMailDocument(props.trigger)
        if (uniqueMailDocument && uniqueMailDocument.labelId !== document.labelId) copyMailSettings(uniqueMailDocument, document)
    }
}

function toggleAll() {
    const open = !allOpen.value
    currentState.value?.enabledKinds.forEach((kind: OutputKind) => (props.openOutputs[kind] = open))
}

function editUniqueMailDocument() {
    const uniqueMailDocument = currentState.value?.inheritedFrom
    if (!uniqueMailDocument) return
    emit('update:activeLabelId', uniqueMailDocument.labelId as string)
    props.openOutputs.mail = true
}

function copyMailToAll() {
    const source = current.value
    if (!source) return
    const targets = documents.value.filter((document: iTriggerDocument) => document.labelId !== source.labelId)
    targets.forEach((document: iTriggerDocument) => {
        document.sendmail = true
        applyOutputDefaults(document, 'mail')
        copyMailSettings(source, document)
        if (source.expression !== undefined) document.expression = source.expression
        if (source.zipMailName !== undefined) document.zipMailName = source.zipMailName
    })
    $q.notify({ type: 'positive', message: t('managers.scheduler.mailCopied', { n: targets.length }) })
}
</script>

<style scoped lang="scss">
.scheduler-outputs__tabs {
    color: var(--kn-color-default);
}

.scheduler-outputs__dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex: none;

    &--ok {
        background: var(--kn-color-success);
    }

    &--error {
        background: var(--kn-color-error);
    }
}

.scheduler-outputs__tab-icon {
    color: var(--kn-editor-list-icon-color);
}

.scheduler-outputs__toggle {
    border: 1px solid var(--kn-color-borders);
}

.scheduler-outputs__section {
    border: 1px solid var(--kn-color-borders);
    border-radius: 4px;
    margin-top: 8px;
    background: #ffffff;

    &--off {
        background: #fafafa;
        color: var(--kn-color-disabled);
    }
}

.scheduler-outputs__section-icon {
    min-width: 32px;
}

.scheduler-outputs__form {
    padding: 8px 16px 14px;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.scheduler-outputs__missing {
    color: var(--kn-color-error);
    font-size: 0.8rem;
}

.scheduler-outputs__footer {
    margin-top: 14px;
    padding-top: 10px;
    border-top: 1px dashed rgba(0, 0, 0, 0.12);
}
</style>
