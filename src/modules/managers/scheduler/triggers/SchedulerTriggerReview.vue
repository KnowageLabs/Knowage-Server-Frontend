<template>
    <div class="scheduler-review" data-tour-id="scheduler-trigger-review">
        <div class="scheduler-schedule-box row no-wrap items-start">
            <q-icon name="schedule" size="20px" class="scheduler-schedule-box__icon q-mr-sm" />
            <div class="col">
                <div class="kn-editor-card-label">{{ trigger.triggerDescription || trigger.triggerName || '-' }}</div>
                <div class="text-weight-medium">{{ schedule }}</div>
            </div>
        </div>

        <div class="kn-editor-card-label q-mt-md q-mb-xs">{{ $t('managers.scheduler.outputsPerDocument') }}</div>
        <div v-for="row in rows" :key="row.document.labelId" class="scheduler-review__row row items-center no-wrap" :class="{ 'scheduler-review__row--clickable': !readonly }" data-test="review-row" @click="!readonly && emit('openDocument', row.document.labelId as string)">
            <q-icon :name="row.state.valid ? 'check_circle' : 'error'" :class="row.state.valid ? 'text-positive' : 'text-negative'" size="20px" class="q-mr-sm" />
            <div class="col scheduler-review__text">
                <div class="row items-center no-wrap q-gutter-x-sm">
                    <span class="text-weight-medium ellipsis">{{ row.document.label }}</span>
                    <span v-if="!row.state.isTalend" class="scheduler-review__format">{{ row.document.outputType || 'PDF' }}</span>
                </div>
                <div class="text-grey-7 text-caption ellipsis">{{ row.summary }}</div>
            </div>
            <q-icon v-if="!readonly" name="chevron_right" class="kn-editor-action" />
        </div>

        <q-banner v-if="!readonly && !valid" dense rounded class="bg-red-1 text-negative q-mt-md">
            <template #avatar><q-icon name="error" /></template>
            {{ $t('managers.scheduler.fixBeforeSave') }}
        </q-banner>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { iJobInfo, iTriggerDocument, iTriggerDraft } from '../Scheduler'
import { describeChrono, describeDocumentOutputs, getDocumentState, isTriggerValid } from '../schedulerHelpers'
import { getLocale } from '@/helpers/commons/localeHelper'

const props = defineProps<{ trigger: iTriggerDraft; datasets?: any[]; jobInfo?: iJobInfo | null; readonly?: boolean }>()
const emit = defineEmits<{ (e: 'openDocument', labelId: string): void }>()

const { t } = useI18n()
const locale = getLocale(true)

const schedule = computed(() => describeChrono(props.trigger, t as any, locale, props.datasets))
const valid = computed(() => isTriggerValid(props.trigger, { jobInfo: props.jobInfo }))

const rows = computed(() =>
    (props.trigger.documents ?? []).map((document: iTriggerDocument) => {
        const state = getDocumentState(document, props.trigger, { jobInfo: props.jobInfo })
        let summary = ''
        if (state.isTalend) summary = t('managers.scheduler.talendWarning')
        else if (state.noOutput) summary = t('managers.scheduler.noOutput')
        else summary = describeDocumentOutputs(document, props.trigger, t as any) + (state.valid ? '' : ' (' + t('managers.scheduler.incomplete').toLowerCase() + ')')
        return { document, state, summary }
    })
)
</script>

<style scoped lang="scss">
.scheduler-schedule-box {
    background: #f3f8fc;
    border: 1px solid var(--kn-color-secondary);
    border-left: 4px solid var(--kn-color-info);
    padding: 10px 12px;
}

.scheduler-schedule-box__icon {
    color: var(--kn-color-info);
}

.scheduler-review__row {
    min-height: 48px;
    padding: 6px 4px;
    border-bottom: 1px solid #eeeeee;
}

.scheduler-review__row--clickable {
    cursor: pointer;

    &:hover {
        background: var(--kn-editor-row-hover-background);
    }
}

.scheduler-review__text {
    min-width: 0;
}

.scheduler-review__format {
    flex: none;
    border-radius: 12px;
    padding: 0 8px;
    font-size: 0.72rem;
    background: #e0e0e0;
}
</style>
