import mainStore from '../../App.store'
import axios from '@/axios.js'
import router from '@/app.routes'

async function invalidateSession(jsps: string[] = [], redirectURI: string): Promise<void> {
    const jspPromises = jsps.map((p) => {
        return axios.get(p)
    })

    await Promise.allSettled([...jspPromises])
    window.location.href = redirectURI
}

export default {
    async logout(): Promise<void> {
        const url = window.location.origin
        await axios
            .post(`${url}${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/logout`)
            .then((response) => {
                invalidateSession(response.data.urlEnginesInvalidate, response.data.redirectUrl.replace('${id_token}', sessionStorage.getItem('token') || ''))
            })
            .finally(() => {
                const store = mainStore()
                localStorage.clear()
                sessionStorage.clear()
                store.storeClearIndexedDBCache()
                store.setUser({})
                router.replace({ path: '/login', query: {}, hash: '' })
            })
    },
    handleUnauthorized(): void {
        const store = mainStore()
        localStorage.clear()
        store.setUser({})
        const url = window.location.origin
        let search = window.location.search ?? ''
        if (search && search.charAt(0) === '?') search = '&' + search.substring(1)
        window.location.href = `${url}${import.meta.env.VITE_KNOWAGE_CONTEXT}/servlet/AdapterHTTP?PAGE=LoginPage&NEW_SESSION=TRUE${search}`
    }
}
