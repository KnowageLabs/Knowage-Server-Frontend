import mainStore from '@/App.store'

export default [
    {
        path: '/login-page-management',
        name: 'login-page-management',
        component: () => import('@/modules/managers/loginPageManagement/LoginPageManagement.vue'),
        beforeEnter: () => (mainStore().user?.isSuperadmin ? true : { name: '404', replace: true })
    }
]
