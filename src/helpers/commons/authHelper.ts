import mainStore from '../../App.store'
import pinia from '@/pinia'
import axios from '@/axios.js'
import router from '@/App.routes'

async function invalidateSession(jsps: string[] = [], redirectURI: string, query: string): Promise<void> {
    const jspPromises = jsps.map((p) => {
        return axios.get(p)
    })

    await Promise.allSettled([...jspPromises])
    if (redirectURI) window.location.href = redirectURI
    else router.replace({ path: '/login', query: { logout: query }, hash: '' })
}

export default {
    async logout(query): Promise<void> {
        const store = mainStore(pinia)
        store.setLoading(true)
        const url = window.location.origin
        await axios
            .post(`${url}${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/logout`)
            .then((response) => {
                invalidateSession(response.data.urlEnginesInvalidate, response.data.redirectUrl.replace('${id_token}', sessionStorage.getItem('idToken') || ''), query)
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
        this.logout(search)
    }
}
