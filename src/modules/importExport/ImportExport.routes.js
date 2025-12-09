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
            },
            {
                path: 'kpi',
                component: () => import('@/modules/importExport/kpi/ImportExportKpi.vue')
            },
            {
                path: 'glossary',
                component: () => import('@/modules/importExport/glossary/ImportExportGlossary.vue')
            },
            {
                path: 'drivers',
                component: () => import('@/modules/importExport/drivers/ImportExportDrivers.vue')
            },
            {
                path: 'menu',
                component: () => import('@/modules/importExport/menu/ImportExportMenu.vue')
            }
        ]
    }
]

export default routes
