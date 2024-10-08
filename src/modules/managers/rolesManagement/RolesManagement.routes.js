const routes = [
    {
        path: '/roles-management',
        name: 'roles-management',
        meta: { functionality: 'ProfileManagement' },
        component: () => import('@/modules/managers/rolesManagement/RolesManagement.vue'),
        children: [
            {
                path: '',
                component: () => import('@/modules/managers/rolesManagement/RolesManagementHint.vue')
            },
            {
                path: 'new-role',
                name: 'new-role',
                component: () => import('@/modules/managers/rolesManagement/RolesManagementTabView.vue')
            },
            {
                path: ':id',
                name: 'edit-role',
                component: () => import('@/modules/managers/rolesManagement/RolesManagementTabView.vue'),
                props: true
            }
        ]
    }
]

export default routes
