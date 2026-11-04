<template>
    <q-btn-dropdown v-if="items.length" unelevated no-caps color="primary" icon="add" :label="$t('workspace.newDocument')" class="kn-ws-new" content-class="kn-ws-new-menu" :menu-offset="[0, 4]" data-ws="new" data-tour-id="ws-new">
        <q-list>
            <q-item v-for="item in items" :key="item.id" v-close-popup clickable :data-ws-new="item.id" @click="item.run()">
                <q-item-section avatar class="kn-ws-item-icon"><q-icon :name="item.icon" size="20px" /></q-item-section>
                <q-item-section>
                    <q-item-label>{{ $t(item.labelKey) }}</q-item-label>
                    <q-item-label caption>{{ $t(item.hintKey) }}</q-item-label>
                </q-item-section>
                <q-item-section v-if="item.legacy" side>
                    <q-badge outline color="grey-7" :label="$t('workspace.legacy')" />
                </q-item-section>
            </q-item>
        </q-list>
    </q-btn-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import mainStore from '@/App.store'
import UserFunctionalitiesConstants from '@/UserFunctionalitiesConstants.json'
import { getDocumentBrowserFolders } from '../workspaceApi'

const emit = defineEmits<{ cockpit: []; dossier: [] }>()
const router = useRouter()
const appStore = mainStore()
const F = UserFunctionalitiesConstants

const has = (functionality: string) => !!appStore.user?.functionalities?.includes(functionality)

// The first save of a new dashboard puts it into the personal folder of the user (as createNewDashboard did).
async function createDashboard() {
    const folders = await getDocumentBrowserFolders().catch(() => [])
    const personalFolder = folders.find((folder: any) => folder.codType === 'USER_FUNCT' && folder.name === appStore.user?.userId)
    router.push(`/dashboard/new-dashboard?folderId=${personalFolder?.id ?? ''}&fromWorkspace=true`)
}

// An item shows with its functionality; the button shows when one item shows (B8).
const items = computed(() =>
    [
        { id: 'dashboard', icon: 'sym_o_dashboard', labelKey: 'workspace.new.dashboard', hintKey: 'workspace.new.dashboardHint', show: has(F.CREATE_COCKPIT_FUNCTIONALITY), run: createDashboard },
        { id: 'kpi', icon: 'sym_o_speed', labelKey: 'workspace.new.kpi', hintKey: 'workspace.new.kpiHint', show: has(F.CREATE_SELF_SELVICE_KPI), run: () => router.push('/kpi-edit/new-kpi?from=Workspace') },
        { id: 'map', icon: 'sym_o_map', labelKey: 'workspace.new.map', hintKey: 'workspace.new.mapHint', show: has(F.CREATE_SELF_SELVICE_GEOREPORT), run: () => router.push('/gis/new') },
        { id: 'dossier', icon: 'sym_o_menu_book', labelKey: 'workspace.new.dossier', hintKey: 'workspace.new.dossierHint', show: !!appStore.isEnterprise && has(F.DOSSIER_CREATION), run: () => emit('dossier') },
        { id: 'cockpit', icon: 'sym_o_grid_view', labelKey: 'workspace.new.cockpit', hintKey: 'workspace.new.cockpitHint', legacy: true, show: has(F.CREATE_SELF_SELVICE_COCKPIT), run: () => emit('cockpit') }
    ].filter((item) => item.show)
)
</script>
