<template>
    <q-card>
        <q-card-section class="q-py-sm row items-center no-wrap">
            <div class="ai-section-label col">{{ title }}</div>
            <q-chip dense square :color="chip.color" :text-color="chip.textColor" :icon="chip.icon" class="q-ma-none">{{ chip.label }}</q-chip>
        </q-card-section>
        <q-separator />
        <q-card-section>
            <p class="ai-sync-card__hint">{{ hint }}</p>
            <div class="row q-col-gutter-sm items-end">
                <div class="col-12 col-sm">
                    <q-input :model-value="state.last || $t('common.never')" :label="$t('managers.ai.engine.lastUpdate')" outlined dense readonly hide-bottom-space />
                </div>
                <div class="col-12 col-sm-auto">
                    <q-btn unelevated color="primary" :disable="disable || state.status === 'inProcess'" :loading="state.status === 'inProcess'" icon="sync" :label="actionLabel" class="full-width" @click="$emit('sync')" />
                </div>
            </div>
            <div v-if="detail" class="ai-sync-card__detail q-mt-sm">{{ detail }}</div>
            <q-banner v-if="state.status === 'error' && state.error" dense rounded class="ai-sync-card__error q-mt-sm">
                <template #avatar><q-icon name="error_outline" color="negative" /></template>
                {{ state.error }}
            </q-banner>
        </q-card-section>
    </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { IAiSyncState } from './useAiEngineStatus'

const props = defineProps<{
    title: string
    hint: string
    state: IAiSyncState
    actionLabel: string
    detail?: string
    disable?: boolean
}>()

defineEmits<{ (e: 'sync'): void }>()

const { t } = useI18n()

const chip = computed(() => {
    switch (props.state.status) {
        case 'ok':
            return { label: t('managers.ai.engine.status.ok'), icon: 'check_circle', color: 'green-1', textColor: 'positive' }
        case 'inProcess':
            return { label: t('managers.ai.engine.status.inProcess'), icon: 'sync', color: 'amber-1', textColor: 'orange-9' }
        case 'error':
            return { label: t('managers.ai.engine.status.error'), icon: 'error_outline', color: 'red-1', textColor: 'negative' }
        default:
            return { label: t('managers.ai.engine.status.never'), icon: 'radio_button_unchecked', color: 'grey-3', textColor: 'grey-8' }
    }
})
</script>

<style scoped lang="scss">
.ai-section-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.54);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.ai-sync-card__hint {
    margin: 0 0 12px;
    font-size: 0.85rem;
    color: rgba(0, 0, 0, 0.6);
}

.ai-sync-card__detail {
    font-size: 0.8rem;
    color: rgba(0, 0, 0, 0.6);
}

.ai-sync-card__error {
    background: var(--kn-message-error-background-color);
    color: var(--kn-message-error-color);
    font-size: 0.85rem;
}
</style>
