const routes = [
    {
        path: '/drivers-management',
        name: 'drivers-management',
        meta: { functionality: 'ParameterManagement' },
        component: () => import('@/modules/managers/driversManagement/DriversManagement.vue')
    }
]

export default routes
