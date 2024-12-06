const routes = [
    {
        path: '/domains-management',
        name: 'domains-management',
        meta: { functionality: 'DomainWrite' },
        component: () => import('@/modules/managers/domainsManagement/DomainsManagement.vue')
    }
]

export default routes
