const routes = [
    {
        path: '/users-management',
        name: 'users-management',
        meta: { functionality: 'ProfileManagement' },
        component: () => import('@/modules/managers/usersManagement/UsersManagement.vue')
    }
]

export default routes
