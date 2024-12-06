const routes = [
    {
        path: '/events-management',
        name: 'events-management',
        meta: { functionality: 'EventsManagement' },
        component: () => import('@/modules/managers/eventsManagement/EventsManagement.vue')
    }
]

export default routes
