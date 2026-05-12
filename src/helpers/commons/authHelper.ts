import mainStore from '../../App.store'
import pinia from '@/pinia'
import axios from '@/axios.js'
import router from '@/App.routes'

async function invalidateSession(jsps: string[] = [], redirectURI: string, query: string, redirectPath?: string): Promise<void> {
    const jspPromises = jsps.map((p) => {
        return axios.get(p)
    })

    await Promise.allSettled([...jspPromises])
    if (redirectURI) window.location.href = redirectURI
    else {
        const loginQuery: Record<string, string> = { logout: query }
        if (redirectPath) loginQuery.redirect = redirectPath
        router.replace({ path: '/login', query: loginQuery, hash: '' })
    }
}

export default {
    async logout(unauthorized, query, redirectPath?: string): Promise<void> {
        const store = mainStore(pinia)
        store.setLoading(true)
        const host = window.location.origin
        let endpoint = `${host}${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/logout`
        if (unauthorized) endpoint = `${host}${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/logout/auto`
        await axios
            .post(endpoint)
            .then((response) => {
                invalidateSession(response.data.urlEnginesInvalidate, response.data.redirectUrl?.replace('${id_token}', sessionStorage.getItem('idToken') || ''), query, redirectPath)
            })
            .finally(() => {
                localStorage.clear()
                sessionStorage.clear()
                store.storeClearIndexedDBCache()
                store.setUser({})
                store.setLoading(false)
            })
    },
    handleUnauthorized(): void {
        let search = window.location.search ?? ''
        if (search && search.charAt(0) === '?') search = '&' + search.substring(1)
        this.logout(true, search)
    }
}
