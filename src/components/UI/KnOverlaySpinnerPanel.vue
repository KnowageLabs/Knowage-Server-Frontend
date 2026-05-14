<script setup lang="ts">
import mainStore from '@/App.store'
import { QSpinnerGrid, useQuasar } from 'quasar'
import { watch } from 'vue'

const $q = useQuasar()

const store = mainStore()

const loadingOptions = {
    delay: 0,
    spinner: QSpinnerGrid,
    spinnerColor: 'primary',
    spinnerSize: 80,
    backgroundColor: 'white',
    messageColor: 'primary'
}

watch(
    () => store.loading,
    (loading) => {
        if (loading && loading > 0) $q.loading.show(loadingOptions)
        else $q.loading.hide()
    },
    { immediate: true }
)
</script>
