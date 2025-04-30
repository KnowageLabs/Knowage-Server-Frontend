import mainStore from '@/App.store'

const routes = [
    {
        path: '/dashboard-theme-management',
        name: 'dashboard-theme-management',
        component: () => import('@/modules/managers/dashboardThemeManagement/DashboardThemeManagement.vue'),
        meta: {
            enterprise: true,
            licenses: ['SI']
        },
        beforeEnter: (to, from, next) => {
            console.log('----- CALLED 2')
            const store = mainStore()

            console.log('----- STORE: ', store)
            const user = store.getUser()

            console.log('------------ USER: ', user)

            if (false) {
                next()
            } else {
                next(from.fullPath)
            }
        }
    }
]

export default routes
