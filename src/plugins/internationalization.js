import mainStore from '@/App.store'
import pinia from '@/pinia'

export default {
    install: (app) => {
        const store = mainStore(pinia)
        app.config.globalProperties.$internationalization = (key) => {
            const options = store.$state.internationalization

            const el = options.find((item) => item.label === key)
            return el ? el.message : key
        }
    }
}
