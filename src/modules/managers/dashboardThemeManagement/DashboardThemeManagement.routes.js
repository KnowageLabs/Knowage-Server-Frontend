const routes = [
    {
        path: '/dashboard-theme-management',
        name: 'dashboard-theme-management',
        component: () => import('@/modules/managers/dashboardThemeManagement/DashboardThemeManagement.vue'),
        meta: {
            enterprise: true,
            licenses: ['SI']
        }
    }
]

export default routes
