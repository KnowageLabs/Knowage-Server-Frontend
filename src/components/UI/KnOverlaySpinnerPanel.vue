<script setup lang="ts">
import mainStore from '@/App.store'
import { QSpinner, useQuasar } from 'quasar'
import { watch } from 'vue'

const $q = useQuasar()
const store = mainStore()

const HIDE_DEBOUNCE_MS = 300
let hideTimeout: ReturnType<typeof setTimeout> | null = null

const loadingOptions = {
    delay: 0,
    spinner: QSpinner,
    spinnerColor: 'primary',
    spinnerSize: 80,
    backgroundColor: 'white',
    messageColor: 'primary'
}

watch(
    () => store.loading,
    (loading, prevLoading) => {
        const wasActive = prevLoading && prevLoading > 0
        const isActive = loading && loading > 0

        if (!wasActive && isActive) {
            // 0 → N: show spinner once, cancel any pending hide
            if (hideTimeout) {
                clearTimeout(hideTimeout)
                hideTimeout = null
            }
            $q.loading.show(loadingOptions)
        } else if (wasActive && !isActive) {
            // N → 0: debounce the hide to avoid flicker between consecutive loadings
            if (hideTimeout) clearTimeout(hideTimeout)
            hideTimeout = setTimeout(() => {
                if (!store.loading || store.loading <= 0) $q.loading.hide()
                hideTimeout = null
            }, HIDE_DEBOUNCE_MS)
        }
        // N → M (both > 0): do nothing, spinner is already showing
    },
    { immediate: true }
)
</script>
