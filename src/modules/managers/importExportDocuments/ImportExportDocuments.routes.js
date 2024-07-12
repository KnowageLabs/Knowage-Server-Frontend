const routes = [
    {
        path: '/import-export-documents',
        name: 'import-export-documents',
        component: () => import('@/modules/managers/importExportDocuments/ImportExportDocuments.vue'),
        children: []
    }
]

export default routes
