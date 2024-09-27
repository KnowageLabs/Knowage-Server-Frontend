const routes = [
    {
        path: '/categories-management',
        name: 'categories-management',
        meta: { functionality: 'CategoryManagement' },
        component: () => import('@/modules/managers/categoriesManagement/CategoriesManagement.vue')
    }
]

export default routes
