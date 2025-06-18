const routes = [
    {
        path: '/data-preparation/:id/:processId?/:instanceId?/:dataset?',
        name: 'data-preparation',
        component: () => import('@/modules/workspace/dataPreparation/DataPreparationDetail.vue'),
        props: (route) => ({ id: route.params.id, existingProcessId: route.params.processId, existingInstanceId: route.params.instanceId, existingDataset: route.params.dataset, schedulation: route.params.schedulation })
    }
]

export default routes
