const routes = [
    {
        path: '/dashboard-theme-management',
        name: 'dashboard-theme-management',
        component: () => import('@/modules/managers/dashboardThemeManagement/DashboardThemeManagement.vue'),
        meta: {
            enterprise: true
        }
    }
]

export default routes
