<template>
    <q-layout view="hHh lpR fFf" container style="height: 100%; overflow: hidden">
        <q-page-container>
            <q-page class="row" style="position: unset">
                <q-drawer v-model="drawerVisible" side="left" :width="300" :breakpoint="0" show-if-above bordered class="column no-wrap">
                    <q-toolbar class="kn-toolbar kn-toolbar--primary">
                        <q-toolbar-title>{{ $t('managers.ai.title') }}</q-toolbar-title>
                    </q-toolbar>
                    <q-linear-progress v-if="loadingBm" indeterminate color="primary" />
                    <AiManagementList
                        class="col"
                        :business-models="businessModels"
                        :gold-queries-map="goldQueriesMap"
                        :selected-id="selectedBm?.id ?? null"
                        :engine-selected="!selectedBm"
                        :engine-state="engineState"
                        :saving-ids="savingIds"
                        :loading="loadingBm"
                        @select="(bm) => leaveDetail(() => (selectedBm = bm))"
                        @select-engine="leaveDetail(() => (selectedBm = null))"
                        @toggle-include="saveIncludeInAi"
                    />
                </q-drawer>

                <!-- Absolute, so the content gets the height of the page instead of growing it: the lists inside can then scroll. -->
                <div class="col relative-position">
                    <div class="absolute-full column no-wrap">
                        <AiManagementGoldQueries
                            v-if="selectedBm"
                            :key="selectedBm.id"
                            :business-model="selectedBm"
                            :gold-queries="goldQueriesMap[selectedBm.id] ?? []"
                            :drawer-visible="drawerVisible"
                            @dirty-change="(value) => (detailDirty = value)"
                            @saved="onGoldQueriesSaved"
                            @close="leaveDetail(() => (selectedBm = null))"
                            @toggle-drawer="drawerVisible = !drawerVisible"
                        />
                        <template v-else>
                            <q-toolbar class="kn-toolbar kn-toolbar--secondary">
                                <q-btn flat round dense :icon="drawerVisible ? 'menu_open' : 'menu'" @click="drawerVisible = !drawerVisible">
                                    <q-tooltip :delay="500">{{ $t('common.toggle') }}</q-tooltip>
                                </q-btn>
                                <q-toolbar-title>{{ $t('managers.ai.engine.title') }}</q-toolbar-title>
                            </q-toolbar>
                            <AiManagementEngineOverview
                                class="col"
                                :enabled="enabled"
                                :ai-url="aiUrl"
                                :reachable="reachable"
                                :knowledge-base="knowledgeBase"
                                :business-model-sync="businessModelSync"
                                :included-count="includedIds.length"
                                @sync-knowledge-base="syncKnowledgeBase"
                                @sync-business-models="syncBusinessModels(includedIds)"
                            />
                        </template>
                    </div>
                </div>
            </q-page>
        </q-page-container>
    </q-layout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import mainStore from '@/App.store'
import AiManagementList from './AiManagementList.vue'
import AiManagementEngineOverview from './AiManagementEngineOverview.vue'
import AiManagementGoldQueries from './AiManagementGoldQueries.vue'
import { useAiEngineStatus } from './useAiEngineStatus'
import type { iBusinessModel } from '@/modules/managers/businessModelCatalogue/BusinessModelCatalogue'
import type { IGoldQuery } from './AiManagement'

type IAiBusinessModel = iBusinessModel & { isForAi?: boolean }

const store = mainStore()
const { t } = useI18n()
const $q = useQuasar()

const { aiUrl, enabled, reachable, knowledgeBase, businessModelSync, engineState, syncKnowledgeBase, syncBusinessModels } = useAiEngineStatus()

const businessModels = ref<IAiBusinessModel[]>([])
const goldQueriesMap = ref<Record<number, IGoldQuery[]>>({})
const loadingBm = ref(false)
const savingIds = ref<number[]>([])
const selectedBm = ref<IAiBusinessModel | null>(null)
const drawerVisible = ref(true)
const detailDirty = ref(false)

const includedIds = computed(() => businessModels.value.filter((bm) => bm.isForAi === true).map((bm) => bm.id))

async function loadBusinessModels() {
    loadingBm.value = true
    try {
        const response = await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/businessmodels')
        businessModels.value = response.data || []
        await Promise.all(businessModels.value.map((bm) => loadGoldQueries(bm.id)))
    } finally {
        loadingBm.value = false
    }
}

async function loadGoldQueries(bmId: number) {
    try {
        const response = await axios.get(import.meta.env.VITE_KNOWAGE_API_CONTEXT + `/api/2.0/resources/eng-gpt-data/${bmId}`)
        const data = response.data
        goldQueriesMap.value[bmId] = Array.isArray(data?.sql_gold) ? data.sql_gold : Array.isArray(data) ? data : []
    } catch {
        goldQueriesMap.value[bmId] = []
    }
}

// Saves right away, like the lock toggle in Users Management, and updates only that row.
async function saveIncludeInAi(bm: IAiBusinessModel, value: boolean) {
    savingIds.value.push(bm.id)
    try {
        await axios.put(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/businessmodels/${bm.id}`, { ...bm, isForAi: value })
        bm.isForAi = value
        store.setInfo({ title: t('common.toast.updateTitle'), msg: t('common.toast.updateSuccess') })
    } finally {
        savingIds.value = savingIds.value.filter((id) => id !== bm.id)
    }
}

function onGoldQueriesSaved(queries: IGoldQuery[]) {
    if (selectedBm.value) goldQueriesMap.value[selectedBm.value.id] = queries
    detailDirty.value = false
}

// Leaving the gold queries view with unsaved changes asks first.
function leaveDetail(action: () => void) {
    if (!detailDirty.value) return action()
    $q.dialog({ title: t('common.toast.unsavedChangesHeader'), message: t('common.toast.unsavedChangesMessage'), cancel: true, persistent: true }).onOk(() => {
        detailDirty.value = false
        action()
    })
}

onMounted(loadBusinessModels)
</script>
