const routes = [
    {
        path: '/theme-management',
        name: 'theme-management',
        component: () => import('@/modules/managers/themeManagement/ThemeManagement.vue'),
        meta: {
            functionality: 'ThemeManagement',
            enterprise: true,
            licenses: ['SI']
        }
    }
]

export default routes
