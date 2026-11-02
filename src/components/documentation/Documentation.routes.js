const routes = [
    {
        // /docs opens the start page, /docs/folder/page.md opens that page.
        path: `/docs/:pathMatch(.*)*`,
        name: 'docs',
        component: () => import('@/components/documentation/Documentation.vue')
    }
]

export default routes
