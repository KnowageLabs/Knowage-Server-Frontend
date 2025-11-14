const routes = [
    {
        path: '/log-management',
        name: 'log-management',
        meta: {},
        component: () => import('@/modules/managers/logManagement/LogManagement.vue'),
        //meta: { requiresEnterprise: true }
    },
]
export default routes