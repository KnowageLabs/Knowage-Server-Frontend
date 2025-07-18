const routes = [
    {
        path: '/dashboard/new-dashboard',
        name: 'dashboard-new',
        component: () => import('@/modules/documentExecution/main/DocumentExecution.vue'),
        props: true
    },
    {
        path: '/dashboard/:id',
        name: 'dashboard-execution',
        component: () => import('@/modules/documentExecution/main/DocumentExecution.vue'),
        props: true
    },
    {
        path: '/:mode(registry|document-composite|report|office-doc|olap|map|kpi|dossier|etl)/:id',
        name: 'document-execution',
        component: () => import('@/modules/documentExecution/main/DocumentExecution.vue'),
        props: true
    },
    {
        path: '/embed/:mode(registry|document-composite|report|office-doc|olap|map|report|kpi|dossier|etl)/:id',
        name: 'document-execution-embed',
        component: () => import('@/modules/documentExecution/main/DocumentExecution.vue'),
        props: true
    },
    {
        path: '/workspace/:mode(registry|document-composite|report|office-doc|olap|map|report|kpi|dossier|etl|dashboard|dashboard-view|cockpit-view)/:id',
        name: 'document-execution-workspace',
        component: () => import('@/modules/documentExecution/main/DocumentExecution.vue'),
        props: true
    },
    {
        path: '/olap-designer/:id',
        name: 'olap-designer',
        component: () => import('@/modules/documentExecution/olap/Olap.vue'),
        props: true
    }
]

export default routes
