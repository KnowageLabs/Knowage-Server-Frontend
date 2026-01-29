import mainStore from '../../App.store'
import pinia from '@/pinia'
import axios from '@/axios.js'
import router from '@/app.routes'

async function invalidateSession(jsps: string[] = [], redirectURI: string): Promise<void> {
    const jspPromises = jsps.map((p) => {
        return axios.get(p)
    })

    await Promise.allSettled([...jspPromises])
    const store = mainStore(pinia)
    if (store?.configurations?.['SPAGOBI_SSO.ACTIVE']) window.location.href = redirectURI
    else router.replace({ path: '/login' })
}

export default {
    async logout(query): Promise<void> {
        const store = mainStore(pinia)
        store.setLoading(true)
        const url = window.location.origin
        await axios
            .post(`${url}${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/logout`)
            .then((response) => {
                invalidateSession(response.data.urlEnginesInvalidate, response.data.redirectUrl.replace('${id_token}', sessionStorage.getItem('token') || ''))
            })
            .finally(() => {
                localStorage.clear()
                sessionStorage.clear()
                store.storeClearIndexedDBCache()
                store.setUser({})
                store.setLoading(false)
                router.replace({ path: '/login', query: { query }, hash: '' })
            })
    },
    handleUnauthorized(): void {
        let search = window.location.search ?? ''
        if (search && search.charAt(0) === '?') search = '&' + search.substring(1)
        this.logout(search)
    }
}
