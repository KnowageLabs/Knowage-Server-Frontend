import mainStore from '../../App.store'
import axios from '@/axios.js'

export default {
    async logout(): Promise<void> {
        const store = mainStore()
        localStorage.clear()
        store.storeClearIndexedDBCache()
        store.setUser({})
        const url = window.location.origin
        await axios.post(`${url}${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/logout`)
        window.location.href = `${url}${import.meta.env.VITE_KNOWAGE_CONTEXT}/servlet/AdapterHTTP?PAGE=LoginPage&NEW_SESSION=TRUE`
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
