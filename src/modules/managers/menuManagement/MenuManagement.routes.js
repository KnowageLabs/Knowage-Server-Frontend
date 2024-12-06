const routes = [
    {
        path: '/menu-management',
        name: 'menu-management',
        meta: { functionality: 'MenuManagement' },
        component: () => import('@/modules/managers/menuManagement/MenuManagement.vue')
    }
]

export default routes
