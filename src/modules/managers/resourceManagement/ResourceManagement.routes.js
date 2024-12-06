const routes = [
    {
        path: '/resource-management',
        name: 'resource-management',
        meta: { functionality: 'ResourceManagement' },
        component: () => import('@/modules/managers/resourceManagement/ResourceManagement.vue'),
        meta: { requiresEnterprise: true }
    },
    {
        path: '/models-management',
        name: 'models-management',
        meta: { functionality: 'ResourceManagement' },
        component: () => import('@/modules/managers/resourceManagement/ResourceManagement.vue')
    }
]
export default routes
