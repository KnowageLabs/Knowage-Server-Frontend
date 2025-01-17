<script setup lang="ts">
    import mainStore from '@/App.store'
    import { useQuasar } from 'quasar'

    const $q = useQuasar()


    const store = mainStore()
    store.$subscribe(
        (mutation,state) => {
            if(mutation.events.key === 'loading'){
                if (state.loading && state.loading > 0) $q.loading.show()
                else $q.loading.hide()
            }
        }
    )

</script>

