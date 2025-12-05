const routes = [
    {
        path: '/import-export',
        name: 'import-export',
        component: () => import('@/modules/importExport/ImportExport.vue'),
        children: [
            {
                path: '',
                component: () => import('@/modules/importExport/ImportExportHint.vue')
            },
            {
                path: 'gallery',
                component: () => import('@/modules/importExport/gallery/ImportExportGallery.vue')
            },
            {
                path: 'catalogfunction',
                component: () => import('@/modules/importExport/catalogFunction/ImportExportCatalogFunction.vue')
            },
            {
                path: 'users',
                component: () => import('@/modules/importExport/users/ImportExportUsers.vue')
            }
        ]
    }
]

export default routes
