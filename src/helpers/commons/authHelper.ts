import mainStore from '../../App.store'
import pinia from '@/pinia'
import axios from '@/axios.js'
import router from '@/App.routes'
import { isFederatedSession } from './samlAuth'

let federatedLogoutPending = false

function resolveLogoutRedirectURI(redirectURI?: string): string {
    if (!redirectURI) return ''

    try {
        const logoutUrl = new URL(redirectURI, window.location.origin)
        const idToken = sessionStorage.getItem('idToken')

        if (logoutUrl.searchParams.has('id_token_hint')) {
            if (idToken) {
                logoutUrl.searchParams.set('id_token_hint', idToken)
                return logoutUrl.toString()
            }

            const oidcClientId = sessionStorage.getItem('oidcClientId')
            if (!oidcClientId) return ''

            logoutUrl.searchParams.delete('id_token_hint')
            logoutUrl.searchParams.set('client_id', oidcClientId)
            return logoutUrl.toString()
        }

        return logoutUrl.toString()
    } catch (error) {
        console.warn('Unable to resolve logout redirect URI', error)
        return ''
    }
}

async function invalidateSession(jsps: string[] = [], redirectURI: string, query: string, redirectPath: string | undefined, cleanup: () => void, samlRequest?: string): Promise<void> {
    const jspPromises = jsps.map((p) => {
        return axios.get(p)
    })

    await Promise.allSettled([...jspPromises])
    cleanup()
    if (samlRequest) {
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = redirectURI
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = 'SAMLRequest'
        input.value = samlRequest
        form.appendChild(input)
        document.body.appendChild(form)
        form.submit()
    } else if (redirectURI) window.location.href = redirectURI
    else {
        const loginQuery: Record<string, string> = { logout: query }
        if (redirectPath) loginQuery.redirect = redirectPath
        await router.replace({ path: '/login', query: loginQuery, hash: '' })
    }
}

export default {
    async logout(unauthorized, query, redirectPath?: string): Promise<void> {
        if (federatedLogoutPending) return
        const store = mainStore(pinia)
        const federated = isFederatedSession()
        if (federated) federatedLogoutPending = true
        store.setLoading(true)
        let leavingForIdp = false
        let cleaned = false
        const cleanup = () => {
            if (!cleaned) {
                cleaned = true
                localStorage.clear()
                sessionStorage.clear()
                store.storeClearIndexedDBCache()
                store.setUser({})
                store.setLoading(false)
            }
        }
        try {
            if (federated && unauthorized) {
                await invalidateSession([], '', query || 'sessionExpired', redirectPath, cleanup)
                return
            }
            const host = window.location.origin
            let endpoint = `${host}${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/logout`
            if (unauthorized) endpoint = `${host}${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/logout/auto`
            const response = await axios.post(endpoint)
            const samlRequest = response.data.samlLogoutRequest
            const target = samlRequest ? response.data.samlLogoutUrl : resolveLogoutRedirectURI(response.data.redirectUrl)
            await invalidateSession(response.data.urlEnginesInvalidate, target, query, redirectPath, cleanup, samlRequest)
            leavingForIdp = federated && !!target
        } finally {
            cleanup()
            if (!leavingForIdp) federatedLogoutPending = false
        }
    },
    handleUnauthorized(): void {
        if (federatedLogoutPending) return
        let search = window.location.search ?? ''
        if (search && search.charAt(0) === '?') search = '&' + search.substring(1)
        this.logout(true, search)
    }
}
