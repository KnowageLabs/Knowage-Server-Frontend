import mainStore from '../../App.store'

export default {
    logout(): void {
        const store = mainStore()
        localStorage.clear()
        store.storeClearIndexedDBCache()
        store.setUser({})
        const url = window.location.origin
        window.location.href = `${url}${import.meta.env.VITE_KNOWAGE_CONTEXT}/servlet/AdapterHTTP?ACTION_NAME=LOGOUT_ACTION&LIGHT_NAVIGATOR_DISABLED=TRUE&NEW_SESSION=TRUE`
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
