const routes = [
    {
        path: '/alert',
        name: 'alert',
        meta: { functionality: 'AlertManagement' },
        component: () => import('@/modules/kpi/alertDefinition/AlertDefinition.vue'),
        children: [
            {
                path: '',
                component: () => import('@/modules/kpi/alertDefinition/AlertDefinitionHint.vue')
            },
            {
                path: 'new-alert',
                name: 'new-alert',
                component: () => import('@/modules/kpi/alertDefinition/AlertDefinitionDetail.vue')
            },
            {
                path: ':id',
                name: 'edit-alert',
                props: true,
                component: () => import('@/modules/kpi/alertDefinition/AlertDefinitionDetail.vue')
            }
        ]
    }
]

export default routes
