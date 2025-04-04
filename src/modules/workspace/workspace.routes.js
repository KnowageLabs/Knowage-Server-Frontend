import GisRoutes from '@/modules/workspace/gisDocumentDesigner/GisDocumentDesigner.routes.js'
import constants from '@/UserFunctionalitiesConstants.json'

const baseRoutes = [
    {
        path: '/workspace',
        name: 'workspace',
        meta: { functionality: constants.SEE_MY_WORKSPACE },
        component: () => import('@/modules/workspace/Workspace.vue'),
        children: [
            {
                path: '',
                component: () => import('@/modules/workspace/WorkspaceHint.vue')
            },
            {
                path: 'recent',
                meta: { functionality: constants.HOT_LINK_MANAGEMENT },
                component: () => import('@/modules/workspace/views/recentView/WorkspaceRecentView.vue')
            },
            {
                path: 'repository/:id',
                component: () => import('@/modules/workspace/views/repositoryView/WorkspaceRepositoryView.vue'),
                props: true
            },
            {
                path: 'data',
                meta: { functionality: constants.SELF_SERVICE_DATASET_MANAGEMENT },
                component: () => import('@/modules/workspace/views/dataView/WorkspaceDataView.vue')
            },
            {
                path: 'models',
                meta: { functionality: constants.SELF_SERVICE_META_MODEL_MANAGEMENT },
                component: () => import('@/modules/workspace/views/modelsView/WorkspaceModelsView.vue')
            },
            {
                path: 'models/federation-definition/new-federation',
                name: 'new-federation',
                component: () => import('@/modules/workspace/federationDefinition/WorkspaceFederationDefinition.vue')
            },
            {
                path: 'models/federation-definition/:id',
                name: 'edit-federation',
                component: () => import('@/modules/workspace/federationDefinition/WorkspaceFederationDefinition.vue'),
                props: true
            },
            {
                path: 'analysis',
                component: () => import('@/modules/workspace/views/analysisView/WorkspaceAnalysisView.vue')
            },
            {
                path: 'schedulation',
                component: () => import('@/modules/workspace/views/schedulationView/WorkspaceSchedulationView.vue')
            },
            {
                path: 'advanced',
                component: () => import('@/modules/workspace/views/advancedData/WorkspaceAdvancedDataView.vue')
            }
        ]
    }
]

const routes = baseRoutes.concat(GisRoutes)

export default routes
