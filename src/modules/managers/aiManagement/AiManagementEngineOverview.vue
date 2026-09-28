<template>
    <div class="ai-overview">
        <q-scroll-area class="ai-overview__scroll">
            <div class="ai-overview__container">
                <!-- About -->
                <q-card>
                    <q-card-section class="q-py-sm">
                        <div class="ai-section-label">{{ $t('managers.ai.engine.about') }}</div>
                    </q-card-section>
                    <q-separator />
                    <q-card-section class="text-body2">{{ $t('managers.ai.hint') }}</q-card-section>
                </q-card>

                <!-- Connection -->
                <q-card>
                    <q-card-section class="q-py-sm">
                        <div class="ai-section-label">{{ $t('managers.ai.engine.connection') }}</div>
                    </q-card-section>
                    <q-separator />
                    <q-card-section>
                        <template v-if="enabled">
                            <q-input :model-value="aiUrl" :label="$t('managers.ai.engine.url')" outlined dense readonly hide-bottom-space />
                            <div class="ai-status q-mt-sm">
                                <q-spinner v-if="reachable === null" size="16px" color="grey-6" />
                                <q-icon v-else :name="reachable ? 'check_circle' : 'cloud_off'" :color="reachable ? 'positive' : 'negative'" size="18px" />
                                <span>{{ reachable === null ? $t('managers.ai.engine.status.checking') : reachable ? $t('managers.ai.engine.status.reachable') : $t('managers.ai.engine.status.unreachable') }}</span>
                            </div>
                        </template>
                        <div v-else class="ai-status">
                            <q-icon name="info" color="grey-6" size="18px" />
                            <span>{{ $t('managers.ai.engine.notConfigured') }}</span>
                        </div>
                    </q-card-section>
                </q-card>

                <template v-if="enabled">
                    <!-- Knowledge base -->
                    <AiManagementSyncCard
                        :title="$t('managers.ai.engine.knowledgeBase')"
                        :hint="$t('managers.ai.engine.knowledgeBaseHint')"
                        :state="knowledgeBase"
                        :action-label="$t('managers.ai.syncronize')"
                        @sync="$emit('syncKnowledgeBase')"
                    />

                    <!-- Business models sync -->
                    <AiManagementSyncCard
                        :title="$t('managers.ai.engine.businessModelsSync')"
                        :hint="$t('managers.ai.engine.businessModelsSyncHint')"
                        :detail="$t('managers.ai.engine.includedCount', includedCount)"
                        :state="businessModelSync"
                        :action-label="$t('managers.ai.businessModels.syncronize')"
                        :disable="includedCount === 0"
                        @sync="$emit('syncBusinessModels')"
                    />
                </template>
            </div>
        </q-scroll-area>
    </div>
</template>

<script setup lang="ts">
import AiManagementSyncCard from './AiManagementSyncCard.vue'
import type { IAiSyncState } from './useAiEngineStatus'

defineProps<{
    enabled: boolean
    aiUrl: string
    reachable: boolean | null
    knowledgeBase: IAiSyncState
    businessModelSync: IAiSyncState
    includedCount: number
}>()

defineEmits<{
    (e: 'syncKnowledgeBase'): void
    (e: 'syncBusinessModels'): void
}>()
</script>

<style scoped lang="scss">
.ai-overview {
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
    min-height: 0;
    background-color: #f3f3f3;
}

.ai-overview__scroll {
    flex: 1;
}

.ai-overview__container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 800px;
    margin: 0 auto;
    padding: 16px;
}

.ai-section-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.54);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.ai-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.875rem;
}
</style>
