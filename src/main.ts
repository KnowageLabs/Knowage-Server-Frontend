import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config'
import store from './App.store.js'
import { createPinia } from 'pinia'
import { Quasar, Notify, Loading, Dialog, TouchPan } from 'quasar'
import router from './App.routes.js'

import VueAxios from 'vue-axios'
import interceptor from './axios.js'

import 'primevue/resources/themes/mdc-light-indigo/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'
import '@fortawesome/fontawesome-free/css/all.css'
import 'primeflex/primeflex.css'
import '@/assets/css/dialects-icons.css'
import 'material-icons/iconfont/material-icons.css'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/dist/quasar.css'
import '@quasar/extras/roboto-font/roboto-font.css'

import ToastService from 'primevue/toastservice'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import ProgressBar from 'primevue/progressbar'
import Toolbar from 'primevue/toolbar'
import Tooltip from 'primevue/tooltip'
import BadgeDirective from 'primevue/badgedirective'

import ConfirmationService from 'primevue/confirmationservice'
import internationalizationPlugin from './plugins/internationalization.js'

import i18n from '@/App.i18n'

import QBEOperator from './modules/qbe/qbeDialogs/qbeAdvancedFilterDialog/QBEOperator.vue'

if (import.meta.env.DEV) document.domain = 'localhost'

import { GridLayout, GridItem } from 'grid-layout-plus'

import { AgGridVue } from 'ag-grid-vue3'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
ModuleRegistry.registerModules([AllCommunityModule])

import ResizeObserver from '@vue-toys/resize-observer'

import { registerSW } from 'virtual:pwa-register'

const pinia = createPinia()

const app = createApp(App).use(pinia)

const mainStore = store()

app.use(VueAxios, interceptor)
    .use(mainStore)
    .use(router)
    .use(i18n)
    .use(PrimeVue)
    .use(ToastService)
    .use(ConfirmationService)
    .use(internationalizationPlugin, mainStore.$state.internationalization)
    .use(ResizeObserver)
    .use(Quasar, {
        plugins: {
            Dialog,
            Notify,
            Loading
        },
        directives: {
            TouchPan
        }
    })

    .directive('badge', BadgeDirective)
    .directive('tooltip', Tooltip)

    .component('Button', Button)
    .component('Card', Card)
    .component('InputText', InputText)
    .component('ProgressBar', ProgressBar)
    .component('Toolbar', Toolbar)
    .component('QBEOperator', QBEOperator)
    .component('GridLayout', GridLayout)
    .component('GridItem', GridItem)
    .component('AgGridVue', AgGridVue)

router.isReady().then(() => {
    app.mount('#app')
})

const updateSW = registerSW({
    onNeedRefresh() {
        Notify.create({
            message: 'Some new content is available',
            timeout: 0,
            actions: [
                {
                    label: 'Refresh',
                    handler: () => {
                        updateSW()
                    }
                },
                {
                    label: 'Cancel',
                    handler: () => {}
                }
            ]
        })
    }
})
