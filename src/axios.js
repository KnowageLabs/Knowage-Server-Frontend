import axios from 'axios'
import router from './App.routes.js'
import mainStore from './App.store.js'
import authHelper from '@/helpers/commons/authHelper'
import { useCookies } from 'vue3-cookies'
import { v4 as uuidv4 } from 'uuid'

const { cookies } = useCookies()
let uuid = uuidv4()

async function refreshPublicInstance() {
    localStorage.setItem('sessionRefreshPending', true)
    const store = mainStore()
    const response = await fetch(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/3.0/public-user?organization=${localStorage.getItem('organization')}`)
    if (response.status === 200) {
        const responseJson = await response.json()
        localStorage.setItem('token', responseJson.userUniqueIdentifier)
        localStorage.setItem('lastResponseTimestamp', new Date().getTime())
    } else store.setError({ title: 'common.error.generic', msg: 'common.error.refresh' })
    localStorage.removeItem('sessionRefreshPending')
}

async function sessionPendingTimeoutFn() {
    return new Promise((resolve) => {
        if (localStorage.getItem('sessionRefreshPending')) {
            const interval = setInterval(() => {
                if (!localStorage.getItem('sessionRefreshPending')) {
                    clearInterval(interval)
                    resolve()
                }
            }, 500)
        } else resolve('pending')
    })
}

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

axios.interceptors.request.use(
    async (config) => {
        if (!config.headers['x-session-polling']) {
            let CSRFToken = null
            if (localStorage.getItem('X-CSRF-TOKEN')) CSRFToken = localStorage.getItem('X-CSRF-TOKEN')
            else {
                CSRFToken = uuid
                await localStorage.setItem('X-CSRF-TOKEN', uuid)
            }
            await cookies.set('X-CSRF-TOKEN', CSRFToken, 0, null, null, true, 'Strict')
            config.headers['X-CSRF-TOKEN'] = CSRFToken
        }

        if (localStorage.getItem('public')) {
            if (new Date().getTime() - localStorage.getItem('lastResponseTimestamp') > import.meta.env.VITE_SESSION_TIMEOUT) {
                const sessionPending = await sessionPendingTimeoutFn()
                if (sessionPending === 'pending') await refreshPublicInstance()
            }
        }

        if (localStorage.getItem('token') && !config.headers['x-session-polling']) config.headers[import.meta.env.VITE_DEFAULT_AUTH_HEADER] = 'Bearer ' + localStorage.getItem('token')
        if (config.headers['x-session-polling']) delete config.headers['x-session-polling']
        if (localStorage.getItem('locale')) config.headers['Accept-Language'] = localStorage.getItem('locale')
        return config
    },
    (error) => {
        Promise.reject(error)
    }
)

axios.interceptors.response.use(
    (res) => {
        localStorage.setItem('lastResponseTimestamp', new Date().getTime())
        const store = mainStore()
        if (res.config.headers['X-Disable-Interceptor']) return res
        if (res.data && res.data.errors) {
            if (!res.config.headers['X-Disable-Errors']) store.setError({ title: 'Server error', msg: res.data.errors[0].message })
            return Promise.reject(res.data.errors[0])
        }
        return res
    },
    function (error) {
        const store = mainStore()
        if (error.response && error.response.status) {
            if (error.response.status === 401) {
                if (router.currentRoute.value.name !== 'login') authHelper.handleUnauthorized()
            }
            if ([400, 500].includes(error.response.status)) {
                let obj = error.response.data
                if (error.response.data instanceof ArrayBuffer) {
                    obj = JSON.parse(new TextDecoder().decode(error.response.data))
                }
                if (obj.errors) {
                    if (obj.errors[0].code) {
                        const errArray = obj.errors

                        for (const idx in errArray) {
                            const err = errArray[idx]

                            let hints = ''
                            for (const hintIdx in err.hints) {
                                const hint = err.hints[hintIdx]

                                if (idx > 0) hints += '\n' + hint
                                else hints += hint
                            }
                            store.setError({ title: err.message, msg: hints })
                        }
                    } else {
                        store.setError({ title: 'Server error', msg: obj.errors[0].message })
                    }
                }
            }
        }
        return Promise.reject(error)
    }
)

export default axios
