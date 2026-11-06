import GisRoutes from '@/modules/workspace/gisDocumentDesigner/GisDocumentDesigner.routes.js'
import constants from '@/UserFunctionalitiesConstants.json'
import pinia from '@/pinia'
import mainStore from '@/App.store'
import useWorkspaceStore from '@/modules/workspace/workspace.store'
import { canSeeWorkspaceTab, WORKSPACE_TABS } from '@/modules/workspace/workspaceHelpers'

// A tab URL without the tab's functionality gives the 404 page. The same rule hides the tab (spec 5.2).
const tabGuard = (tab) => () => (canSeeWorkspaceTab(mainStore(pinia).user, tab) ? true : { name: '404', replace: true })

// /workspace opens the last tab of the session with its last query, else the first allowed tab (spec 5.3).
const lastTabLocation = () => {
    const user = mainStore(pinia).user
    const store = useWorkspaceStore(pinia)
    const allowed = WORKSPACE_TABS.filter((tab) => canSeeWorkspaceTab(user, tab))
    const tab = store.lastTab && allowed.includes(store.lastTab) ? store.lastTab : (allowed[0] ?? 'documents')
    return { path: `/workspace/${tab}`, query: store.tabQueries?.[tab] ?? {}, replace: true }
}

const documents = (query = {}) => ({ path: '/workspace/documents', query })

function dataTabRedirect(to) {
    const { kind, ...rest } = to.query
    if (kind === 'model') return { path: '/workspace/models', query: Object.fromEntries(Object.entries({ category: rest.category, q: rest.q }).filter(([, value]) => value)) }
    return { path: '/workspace/datasets', query: rest }
}

const baseRoutes = [
    {
        path: '/workspace',
        name: 'workspace',
        meta: { functionality: constants.SEE_MY_WORKSPACE },
        component: () => import('@/modules/workspace/Workspace.vue'),
        children: [
            // a guard, not a redirect: it must run after the global guard has loaded the user and pinia
            { path: '', name: 'workspace-home', component: { render: () => null }, beforeEnter: lastTabLocation },
            {
                path: 'documents',
                name: 'workspace-documents',
                meta: { wsTab: 'documents' },
                beforeEnter: tabGuard('documents'),
                component: () => import('@/modules/workspace/documents/WorkspaceDocumentsTab.vue')
            },
            {
                path: 'datasets',
                name: 'workspace-datasets',
                meta: { wsTab: 'datasets' },
                beforeEnter: tabGuard('datasets'),
                component: () => import('@/modules/workspace/data/WorkspaceDatasetsTab.vue')
            },
            {
                path: 'models',
                name: 'workspace-models',
                meta: { wsTab: 'models' },
                beforeEnter: tabGuard('models'),
                component: () => import('@/modules/workspace/data/WorkspaceModelsTab.vue')
            },
            {
                path: 'scheduled',
                name: 'workspace-scheduled',
                meta: { wsTab: 'scheduled' },
                beforeEnter: tabGuard('scheduled'),
                component: () => import('@/modules/workspace/scheduled/WorkspaceScheduledTab.vue')
            },
            // Old URLs: bookmarks, Menu Management initialPath values, return targets of other pages.
            { path: 'recent', redirect: () => documents({ scope: 'recent' }) },
            { path: 'repository/:id', redirect: (to) => documents({ collection: to.params.id }) },
            { path: 'repository', redirect: () => documents() },
            { path: 'analysis', redirect: () => documents({ scope: 'mine' }) },
            { path: 'models/federation-definition/:rest(.*)*', redirect: () => documents() },
            { path: 'schedulation', redirect: () => ({ path: '/workspace/scheduled' }) },
            { path: 'advanced', redirect: () => documents() },
            // the round 1 Data tab (spec 5.3): kind=model alone opens Business models, anything else Datasets
            { path: 'data', redirect: dataTabRedirect }
        ]
    }
]

const routes = baseRoutes.concat(GisRoutes)

export default routes
