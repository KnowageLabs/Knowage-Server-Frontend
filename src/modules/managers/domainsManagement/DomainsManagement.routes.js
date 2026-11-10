const routes = [
    {
        path: '/domains-management',
        name: 'domains-management',
        meta: { functionality: 'DomainManagement' },
        component: () => import('@/modules/managers/domainsManagement/DomainsManagement.vue')
    }
]

export default routes
