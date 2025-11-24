import { createRouter, createWebHistory } from 'vue-router'
import IframeRenderer from '@/modules/commons/IframeRenderer.vue'
import managersRoutes from '@/modules/managers/managers.routes.js'
import importExportRoutes from '@/modules/importExport/ImportExport.routes.js'
import kpiRoutes from '@/modules/kpi/kpi.routes.js'
import documentExecutionRoutes from '@/modules/documentExecution/documentExecution.routes.js'
import documentBrowserRoutes from '@/modules/documentBrowser/DocumentBrowser.routes.js'
import workspaceRoutes from '@/modules/workspace/workspace.routes.js'
import overlayRoutes from '@/overlay/Overlay.routes.js'
import authHelper from '@/helpers/commons/authHelper'
import dataPreparationRoutes from '@/modules/workspace/dataPreparation/DataPreparation.routes.js'
import documentationRoutes from '@/components/documentation/Documentation.routes.js'
import { loadLanguageAsync } from '@/App.i18n.js'
import mainStore from '@/App.store'

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

const baseRoutes = [
    {
        path: '/',
        name: 'home',
        component: () => import('@/views/Home.vue')
    },
    {
        path: '/externalUrl/',
        name: 'externalUrl',
        component: IframeRenderer,
        props: (route) => ({ url: route.params.url, externalLink: true })
    },
    {
        path: `${import.meta.env.VITE_KNOWAGE_CONTEXT}/servlet/:catchAll(.*)`,
        name: 'knowageUrl',
        component: IframeRenderer,
        props: (route) => ({ url: route.fullPath })
    },
    {
        path: `${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/publish:catchAll(.*)`,
        component: IframeRenderer,
        props: (route) => ({ url: route.fullPath })
    },
    {
        path: `${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/signup:catchAll(.*)`,
        component: IframeRenderer,
        props: (route) => ({ url: route.fullPath })
    },
    {
        path: `${import.meta.env.VITE_KNOWAGE_CONTEXT}/themes:catchAll(.*)`,
        component: IframeRenderer,
        props: (route) => ({ url: route.fullPath })
    },
    {
        path: '/login',
        name: 'login',
        redirect: `${import.meta.env.VITE_HOST_URL}${import.meta.env.VITE_KNOWAGE_CONTEXT}/servlet/AdapterHTTP?PAGE=LoginPage&NEW_SESSION=TRUE`
    },
    {
        path: '/unauthorized',
        name: 'unauthorized',
        component: () => import('@/views/Unauthorized.vue'),
        props: true,
        meta: { hideMenu: true, public: true }
    },
    {
        path: '/html',
        name: 'html',
        component: () => import('@/modules/commons/HtmlRenderer.vue')
    }
]

const closingRoutes = [
    {
        name: '404',
        path: '/:catchAll(.*)*',
        component: () => import('@/modules/commons/404.vue')
    }
]

const routes = baseRoutes.concat(managersRoutes).concat(importExportRoutes).concat(kpiRoutes).concat(documentExecutionRoutes).concat(documentBrowserRoutes).concat(workspaceRoutes).concat(overlayRoutes).concat(dataPreparationRoutes).concat(documentationRoutes).concat(closingRoutes)

const router = createRouter({
    base: import.meta.env.VITE_PUBLIC_PATH,
    history: createWebHistory(import.meta.env.VITE_PUBLIC_PATH),
    routes
})

router.afterEach(async () => {
    if (localStorage.getItem('locale')) loadLanguageAsync(localStorage.getItem('locale'))
})

router.beforeEach(async (to, from, next) => {
    const store = mainStore()

    const checkRequired = !('/' == to.fullPath && '/' == from.fullPath)
    const loggedIn = localStorage.getItem('token')

    if (to.meta.hideMenu || (to.query.menu != 'undefined' && to.query.menu === 'false')) {
        store.hideMainMenu()
    } else store.showMainMenu()

    if (checkRequired && !to.meta.public && !loggedIn && !to.query.public) {
        authHelper.handleUnauthorized()
    } else {
        if (to.meta?.functionality) {
            if (from.path === '/' && !store.user?.functionalities?.includes(to.meta?.functionality)) await sleep(1000)
        }
        if (to.meta?.functionality && !store.user?.functionalities?.includes(to.meta?.functionality)) next({ replace: true, name: '404' })
        else next()
    }
})

export default router
