const routes = [
    {
        path: '/home-management',
        name: 'home-management',
        component: () => import('@/modules/managers/homeManagement/HomeManagement.vue')
    }
]

export default routes
