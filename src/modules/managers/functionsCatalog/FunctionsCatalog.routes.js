const routes = [
    {
        path: '/functions-catalog',
        name: 'functions-catalog',
        meta: { functionality: 'FunctionsCatalogManagement' },
        component: () => import('@/modules/managers/functionsCatalog/FunctionsCatalog.vue')
    }
]

export default routes
