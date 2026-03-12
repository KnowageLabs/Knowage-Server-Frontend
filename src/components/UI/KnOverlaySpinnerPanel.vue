<script setup lang="ts">
import mainStore from '@/App.store'
import { useQuasar } from 'quasar'
import { watch } from 'vue'

const $q = useQuasar()
const store = mainStore()

const HIDE_DEBOUNCE_MS = 300
let hideTimeout: ReturnType<typeof setTimeout> | null = null

watch(
    () => store.loading,
    (loading) => {
        if (loading && loading > 0) {
            // Show immediately and cancel any pending hide
            if (hideTimeout) {
                clearTimeout(hideTimeout)
                hideTimeout = null
            }
            $q.loading.show()
        } else {
            // Debounce the hide: only hide if loading is still 0 after the delay
            if (hideTimeout) clearTimeout(hideTimeout)
            hideTimeout = setTimeout(() => {
                if (!store.loading || store.loading <= 0) $q.loading.hide()
                hideTimeout = null
            }, HIDE_DEBOUNCE_MS)
        }
    }
)
</script>
