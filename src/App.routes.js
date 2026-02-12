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
import pinia from '@/pinia'
import axios from '@/axios.js'

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

let userLoadPromise = null

async function ensureUserLoaded(store) {
    if (store.userLoaded || (store.user && Object.keys(store.user).length > 0)) return true

    const token = localStorage.getItem('token')
    if (!token) return false

    if (!userLoadPromise) {
        userLoadPromise = axios
            .get(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/2.0/currentuser`)
            .then((response) => {
                store.initializeUser(response.data)
                return true
            })
            .catch(() => {
                return false
            })
            .finally(() => {
                userLoadPromise = null
            })
    }

    return userLoadPromise
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
        component: () => import('@/views/login/Login.vue'),
        meta: { hideMenu: true, public: true }
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

router.beforeEach(async (to, from, next) => {
    const store = mainStore(pinia)

    const checkRequired = !('/' == to.fullPath && '/' == from.fullPath)
    let loggedIn = localStorage.getItem('token')

    if (loggedIn) {
        await ensureUserLoaded(store)
    }

    if (to.meta.hideMenu || (to.query.menu != 'undefined' && to.query.menu === 'false')) {
        store.hideMainMenu()
    } else store.showMainMenu()

    // Se l'utente non è autenticato e sta cercando di accedere a una pagina protetta
    if (checkRequired && !to.meta.public && !loggedIn && !to.query.public) {
        // Redirect alla pagina di login locale invece del servlet esterno
        next({
            name: 'login',
            query: { redirect: to.fullPath }
        })
        return
    }

    // Se l'utente è già autenticato e sta cercando di accedere al login
    if (loggedIn && to.name === 'login') {
        next({ name: 'home' })
        return
    }

    if (to.meta?.functionality) {
        const hasFunctionality = store.user?.functionalities?.includes(to.meta?.functionality)

        if (store.user && Object.keys(store.user).length > 0 && !hasFunctionality) {
            next({ replace: true, name: '404' })
            return
        }
        if (!store.user?.isSuperadmin && to.meta?.functionality && !store.user?.functionalities?.includes(to.meta?.functionality)) next({ replace: true, name: '404' })
        else next()
    }

    next()
})

export default router
