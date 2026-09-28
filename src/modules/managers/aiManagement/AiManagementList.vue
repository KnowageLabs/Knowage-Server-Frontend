<template>
    <div class="ai-list column no-wrap">
        <div class="ai-list__search">
            <q-input v-model="filter" outlined dense clearable :placeholder="$t('common.search')">
                <template #append><q-icon name="search" /></template>
            </q-input>
        </div>

        <q-list class="col ai-list__items" separator>
            <!-- AI Engine (pinned) -->
            <q-item clickable :active="engineSelected" active-class="ai-list__item--active" @click="$emit('selectEngine')">
                <q-item-section avatar>
                    <q-avatar size="36px" class="ai-list__avatar ai-list__avatar--engine" icon="smart_toy" />
                </q-item-section>
                <q-item-section>
                    <q-item-label class="ai-list__label">{{ $t('managers.ai.engine.title') }}</q-item-label>
                    <q-item-label caption lines="1">{{ engineCaption }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                    <span class="ai-list__dot" :class="`ai-list__dot--${engineState}`"></span>
                </q-item-section>
            </q-item>

            <q-item
                v-for="bm in filteredModels"
                :key="bm.id"
                clickable
                :active="selectedId === bm.id"
                active-class="ai-list__item--active"
                @click="$emit('select', bm)"
            >
                <q-item-section avatar>
                    <q-avatar size="36px" class="ai-list__avatar" :style="{ background: avatarColor(bm.name) }">{{ bm.name.charAt(0).toUpperCase() }}</q-avatar>
                </q-item-section>
                <q-item-section>
                    <q-item-label class="ai-list__label ellipsis" :title="bm.description || bm.name">{{ bm.name }}</q-item-label>
                    <q-item-label caption lines="1">
                        {{ bm.isForAi ? $t('managers.ai.businessModels.included') : $t('managers.ai.businessModels.notIncluded') }}
                        · {{ $t('managers.ai.goldQueries.queriesCount', goldQueriesCount(bm.id)) }}
                    </q-item-label>
                </q-item-section>
                <q-item-section side>
                    <q-toggle :model-value="bm.isForAi === true" dense :disable="savingIds.includes(bm.id)" @click.stop @update:model-value="$emit('toggleInclude', bm, $event)">
                        <q-tooltip :delay="500">{{ $t('managers.ai.businessModels.enabledToggle') }}</q-tooltip>
                    </q-toggle>
                </q-item-section>
            </q-item>

            <q-item v-if="!loading && filteredModels.length === 0">
                <q-item-section class="text-grey-6">{{ $t('common.info.noDataFound') }}</q-item-section>
            </q-item>
        </q-list>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { iBusinessModel } from '@/modules/managers/businessModelCatalogue/BusinessModelCatalogue'
import type { AiEngineState } from './useAiEngineStatus'

const props = defineProps<{
    businessModels: (iBusinessModel & { isForAi?: boolean })[]
    goldQueriesMap: Record<number, unknown[]>
    selectedId: number | null
    engineSelected: boolean
    engineState: AiEngineState
    savingIds: number[]
    loading: boolean
}>()

defineEmits<{
    (e: 'select', bm: iBusinessModel): void
    (e: 'selectEngine'): void
    (e: 'toggleInclude', bm: iBusinessModel, value: boolean): void
}>()

const { t } = useI18n()
const filter = ref<string | null>('')

const filteredModels = computed(() => {
    const term = (filter.value ?? '').trim().toLowerCase()
    if (!term) return props.businessModels
    return props.businessModels.filter((bm) => `${bm.name} ${bm.description ?? ''}`.toLowerCase().includes(term))
})

function goldQueriesCount(bmId: number): number {
    return props.goldQueriesMap[bmId]?.length ?? 0
}

const engineCaption = computed(() => {
    switch (props.engineState) {
        case 'off':
            return t('managers.ai.engine.status.off')
        case 'ok':
            return t('managers.ai.engine.status.reachable')
        case 'busy':
            return t('managers.ai.engine.status.inProcess')
        case 'error':
            return t('managers.ai.engine.status.error')
        default:
            return t('managers.ai.engine.status.checking')
    }
})

const AVATAR_PALETTE = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#6366f1']
function avatarColor(name: string): string {
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}
</script>

<style scoped lang="scss">
.ai-list {
    height: 100%;
    min-height: 0;
}

.ai-list__search {
    padding: 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.ai-list__items {
    overflow-y: auto;
    min-height: 0;
}

.ai-list__item--active {
    background: var(--kn-list-item-selected-background-color, rgba(0, 0, 0, 0.06));
    color: inherit;
}

.ai-list__avatar {
    color: #ffffff;
    font-weight: 600;
    font-size: 0.9rem;
    border-radius: 8px;

    &--engine {
        background: var(--kn-toolbar-primary-background-color);
    }
}

.ai-list__label {
    font-size: 0.9rem;
}

.ai-list__dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #bdbdbd;

    &--ok {
        background: var(--q-positive);
    }
    &--busy {
        background: var(--q-warning);
    }
    &--error {
        background: var(--q-negative);
    }
}
</style>
