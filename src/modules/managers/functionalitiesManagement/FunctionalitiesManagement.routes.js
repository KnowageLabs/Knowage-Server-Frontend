const routes = [
    {
        path: '/functionalities-management',
        name: 'functionalities-management',
        meta: { functionality: 'FunctionalitiesManagement' },
        component: () => import('@/modules/managers/functionalitiesManagement/FunctionalitiesManagement.vue')
    }
]

export default routes
