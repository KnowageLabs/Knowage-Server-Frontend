<template>
    <div class="row q-col-gutter-sm">
        <div v-if="!readonly" class="col-12">
            <q-toggle :model-value="!!document.uniqueMail" dense :label="$t('managers.scheduler.uniqueMail')" data-test="unique-mail-toggle" @update:model-value="setUniqueMail" />
        </div>
        <div class="col-12">
            <div class="kn-editor-card-label q-mb-xs">{{ $t('managers.scheduler.recipients') }} *</div>
            <q-btn-toggle :model-value="recipientMode" no-caps unelevated toggle-color="primary" color="white" text-color="grey-9" class="scheduler-mail-output__toggle" :readonly="readonly" :disable="readonly" :options="recipientOptions" data-test="recipient-mode" @update:model-value="setRecipientMode" />
        </div>
        <div v-if="document.useFixedRecipients" class="col-12">
            <q-input v-model="document.mailtos" outlined dense hide-bottom-space :readonly="readonly" :maxlength="descriptor.limits.mail.mailTo" :label="$t('managers.scheduler.mailTo') + ' *'" :error="!readonly && !document.mailtos" data-test="mail-to">
                <template #prepend><q-icon name="mail" /></template>
            </q-input>
        </div>
        <div v-if="document.useExpression" class="col-12">
            <q-input v-model="document.expression" outlined dense hide-bottom-space :readonly="readonly" :maxlength="descriptor.limits.mail.expression" :label="$t('managers.scheduler.expression') + ' *'" :error="!readonly && !document.expression">
                <template #prepend><q-icon name="code" /></template>
            </q-input>
        </div>
        <div v-if="document.useDataset" class="col-12 col-sm-6">
            <q-select v-model="document.datasetLabel" outlined dense hide-bottom-space emit-value map-options :readonly="readonly" :options="datasets ?? []" option-label="label" option-value="label" :label="$t('managers.scheduler.datasetVerification') + ' *'" :error="!readonly && !document.datasetLabel" />
        </div>
        <div class="col-12 col-sm-6 row items-center">
            <q-toggle v-model="document.zipMailDocument" dense :disable="readonly" :label="$t('managers.scheduler.zipMailDocument')" />
        </div>
        <div v-if="document.zipMailDocument" class="col-12 col-sm-6">
            <q-input v-model="document.zipMailName" outlined dense hide-bottom-space :readonly="readonly" :maxlength="descriptor.limits.mail.zipMailName" :label="$t('managers.scheduler.zipFileName')">
                <template #prepend><q-icon name="folder_zip" /></template>
            </q-input>
        </div>
        <div class="col-12">
            <q-toggle v-model="document.reportNameInSubject" dense :disable="readonly" :label="$t('managers.scheduler.reportNameInSubject')" />
        </div>
        <div class="col-12 col-sm-6">
            <q-input v-model="document.mailsubj" outlined dense hide-bottom-space :readonly="readonly" :maxlength="descriptor.limits.mail.mailSubject" :label="$t('managers.scheduler.mailSubject')" />
        </div>
        <div class="col-12 col-sm-6">
            <q-input v-model="document.containedFileName" outlined dense hide-bottom-space :readonly="readonly" :maxlength="descriptor.limits.mail.fileName" :label="$t('managers.scheduler.containedFileName')" />
        </div>
        <div class="col-12">
            <q-editor v-model="mailText" min-height="6rem" :readonly="readonly" :placeholder="$t('managers.scheduler.mailTextMessage')" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { iTriggerDocument } from '../../Scheduler'
import descriptor from '../../SchedulerDescriptor.json'

type RecipientMode = 'fixed' | 'expression' | 'dataset'

const props = defineProps<{ document: iTriggerDocument; datasets?: any[]; readonly?: boolean }>()
const emit = defineEmits<{ (e: 'uniqueMailChange'): void }>()

const { t } = useI18n()

const recipientOptions = computed(() => [
    { value: 'fixed', label: t('managers.scheduler.fixedRecipientsList') },
    { value: 'expression', label: t('managers.scheduler.expression') },
    { value: 'dataset', label: t('common.dataset') }
])

const recipientMode = computed<RecipientMode | null>(() => {
    if (props.document.useFixedRecipients) return 'fixed'
    if (props.document.useExpression) return 'expression'
    if (props.document.useDataset) return 'dataset'
    return null
})

// q-editor has no maxlength: the text is cut at the old limit
const mailText = computed({
    get: () => props.document.mailtxt ?? '',
    set: (value: string) => (props.document.mailtxt = value.substring(0, descriptor.limits.mail.mailText))
})

function setUniqueMail(value: boolean) {
    props.document.uniqueMail = value
    emit('uniqueMailChange')
}

// The recipient modes are exclusive: the old accordion cleared the other two
function setRecipientMode(mode: RecipientMode) {
    if (mode === 'fixed') {
        props.document.useFixedRecipients = true
        resetExpression()
        resetDataset()
    } else if (mode === 'expression') {
        props.document.useExpression = true
        resetFixedRecipients()
        resetDataset()
    } else {
        props.document.useDataset = true
        resetFixedRecipients()
        resetExpression()
    }
}

function resetFixedRecipients() {
    if (props.document.useFixedRecipients) {
        props.document.useFixedRecipients = false
        delete props.document.mailtos
    }
}

function resetExpression() {
    if (props.document.useExpression) {
        props.document.useExpression = false
        delete props.document.expression
    }
}

function resetDataset() {
    if (props.document.useDataset) {
        props.document.useDataset = false
        delete props.document.datasetLabel
    }
}
</script>

<style scoped lang="scss">
.scheduler-mail-output__toggle {
    border: 1px solid var(--kn-color-borders);
}
</style>
