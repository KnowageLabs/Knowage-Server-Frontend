const routes = [
    {
        path: '/data-preparation/:id/:instanceId?/:dataset?',
        name: 'data-preparation',
        component: () => import('@/modules/workspace/dataPreparation/DataPreparationDetail.vue'),
        props: (route) => ({ id: route.params.id, existingInstanceId: route.params.instanceId, existingDataset: route.params.dataset, schedulation: route.params.schedulation })
    }
]

export default routes
