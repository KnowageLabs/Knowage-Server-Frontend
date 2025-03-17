<script setup lang="ts">
import mainStore from '@/App.store'
import { useQuasar } from 'quasar'
import { watch } from 'vue'

const $q = useQuasar()

const store = mainStore()

watch(
    () => store.loading,
    (loading) => {
        if (loading && loading > 0) $q.loading.show()
        else $q.loading.hide()
    }
)
</script>
