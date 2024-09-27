const routes = [
    {
        path: '/layers-management',
        name: 'layers-management',
        meta: { functionality: 'GeoLayersManagement' },
        component: () => import('@/modules/managers/layersManagement/LayersManagement.vue')
    }
]

export default routes
