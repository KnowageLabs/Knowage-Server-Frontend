import { onBeforeUnmount, ref, watch } from 'vue'
import axios from 'axios'
import mainStore from '@/App.store'
import type { iDocsSite } from './DocumentationManagement'

const FALLBACK_LOGO = import.meta.env.VITE_PUBLIC_PATH + '/images/commons/knowage-black.svg'

// The logo of the docs site, as the viewer shows it: the tenant logo, an http or data image, or none.
export function useDocsLogo(site: { value: iDocsSite }) {
    const store = mainStore()
    const logoSrc = ref<string | false>(false)
    let blobUrl: string | null = null

    function releaseBlob() {
        if (blobUrl) URL.revokeObjectURL(blobUrl)
        blobUrl = null
    }

    async function refresh() {
        const logo = site.value.logo
        if (typeof logo === 'string' && (logo.startsWith('http') || logo.startsWith('data:'))) {
            releaseBlob()
            logoSrc.value = logo
        } else if (logo) {
            if (!store.user?.organization) {
                logoSrc.value = FALLBACK_LOGO
                return
            }
            try {
                const response = await axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/multitenant/${store.user.organization}/logo-wide`, { responseType: 'blob' })
                releaseBlob()
                blobUrl = URL.createObjectURL(response.data)
                logoSrc.value = blobUrl
            } catch {
                logoSrc.value = FALLBACK_LOGO
            }
        } else {
            releaseBlob()
            logoSrc.value = false
        }
    }

    function onError() {
        logoSrc.value = FALLBACK_LOGO
    }

    watch(() => site.value.logo, refresh, { immediate: true })
    onBeforeUnmount(releaseBlob)
    return { logoSrc, onError }
}
