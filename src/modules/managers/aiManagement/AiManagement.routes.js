const routes = [
    {
        path: '/ai-management',
        name: 'ai-management',
        component: () => import('@/modules/managers/aiManagement/AiManagement.vue'),
        meta: { functionality: 'EngGPTIntegration' }
    }
]

export default routes
