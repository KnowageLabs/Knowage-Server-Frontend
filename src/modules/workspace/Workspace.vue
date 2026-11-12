<template>
    <div class="kn-ws column no-wrap">
        <div class="kn-ws-header">
            <div class="row items-center no-wrap kn-ws-title-row">
                <h1 class="kn-ws-title" data-ws="title">{{ $t('workspace.title') }}</h1>
                <q-space />
                <!-- each tab teleports its New button here -->
                <div id="kn-ws-new-slot" class="row items-center no-wrap"></div>
            </div>
            <q-tabs dense no-caps align="left" indicator-color="primary" active-color="dark" :breakpoint="0" class="kn-ws-tabs" data-tour-id="ws-tabs">
                <q-route-tab v-for="(tab, index) in visibleTabs" :key="tab.name" :name="tab.name" :to="tab.to" :data-tour-id="'ws-tab-' + tab.name">
                    <div class="row items-center no-wrap">
                        <span :data-ws="index === 0 ? 'first-tab-label' : undefined">{{ $t(tab.labelKey) }}</span>
                        <q-badge v-if="tab.count !== null" color="grey-3" text-color="grey-8" :label="tab.count" class="q-ml-sm" />
                    </div>
                </q-route-tab>
            </q-tabs>
        </div>
        <!-- tabs stay alive: switching back shows the list at once, with its scroll position -->
        <router-view v-slot="{ Component }">
            <keep-alive>
                <component :is="Component" class="col" />
            </keep-alive>
        </router-view>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import mainStore from '@/App.store'
import { usePageTour } from '@/composables/usePageTour'
import { startWorkspaceTour } from './WorkspaceTour'
import useWorkspaceStore from './workspace.store'
import { WsTab } from './Workspace'
import { canSeeWorkspaceTab, WORKSPACE_TABS } from './workspaceHelpers'

const route = useRoute()
const { t } = useI18n()
const appStore = mainStore()
const store = useWorkspaceStore()

// started from the ? button only, never by itself (spec 16)
usePageTour(() => startWorkspaceTour(t, (route.meta.wsTab as WsTab) ?? 'documents'))

const LABEL_KEYS: Record<WsTab, string> = { documents: 'workspace.tabs.documents', datasets: 'workspace.tabs.datasets', models: 'workspace.tabs.models', scheduled: 'workspace.tabs.scheduled' }

const allowedTabs = computed(() => WORKSPACE_TABS.filter((tab) => canSeeWorkspaceTab(appStore.user, tab)))

// Tab counts are the unfiltered totals: documents and views, all datasets, business models, latest outputs.
const counts = computed<Record<WsTab, number | null>>(() => ({
    documents: store.documentCount,
    datasets: store.datasets.all?.length ?? null,
    models: store.models?.length ?? null,
    scheduled: store.scheduledLoaded ? store.outputs.length : null
}))

const visibleTabs = computed(() =>
    allowedTabs.value.map((tab) => ({
        name: tab,
        labelKey: LABEL_KEYS[tab],
        count: counts.value[tab],
        // switching back to a tab restores its filters
        to: { path: `/workspace/${tab}`, query: store.tabQueries[tab] ?? {} }
    }))
)

watch(
    () => [route.meta.wsTab, route.query] as const,
    ([tab, query], previous) => {
        if (tab) store.rememberTab(tab as WsTab, query)
        if (tab === 'documents' && (previous?.[0] !== tab || (query.scope === 'recent' && previous?.[1]?.scope !== 'recent'))) {
            store.loadDocuments(true).catch(() => {})
        }
    },
    { immediate: true, deep: true }
)

// The current tab loads its own list; the other tabs load in the background for their counts.
// The store shares one request per list, so a tab and the shell never load the same list twice.
onMounted(() => {
    if (allowedTabs.value.includes('documents')) store.loadDocuments().catch(() => {})
    if (allowedTabs.value.includes('datasets')) store.loadDatasets('all', appStore.user?.userId).catch(() => {})
    if (allowedTabs.value.includes('models')) store.loadModels().catch(() => {})
    if (allowedTabs.value.includes('scheduled')) store.loadScheduled().catch(() => {})
})
</script>

<style lang="scss" src="./workspace.scss"></style>
