const routes = [
    {
        path: '/documentation-management',
        name: 'documentation-management',
        component: () => import('@/modules/managers/documentationManagement/DocumentationManagement.vue'),
        // S4 is open: ResourceManagementDev is not allowed yet.
        meta: { functionality: 'ResourceManagement' }
    }
]

export default routes
