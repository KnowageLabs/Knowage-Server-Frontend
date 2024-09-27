const routes = [
    {
        path: '/constraint-management',
        name: 'constraint-management',
        meta: { functionality: 'ConstraintManagement' },
        component: () => import('@/modules/managers/constraintsManagement/ConstraintsManagement.vue')
    }
]
export default routes
