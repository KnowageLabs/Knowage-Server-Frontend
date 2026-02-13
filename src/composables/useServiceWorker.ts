import { ref, watch } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

export const useServiceWorker = () => {
    const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
        immediate: true,
        onRegistered(registration) {
            console.log('[SW] Service Worker registered successfully')

            if (registration) {
                const interval = import.meta.env.DEV ? 10 * 1000 : 60 * 60 * 1000
                setInterval(() => {
                    registration.update()
                }, interval)
            }
        },
        onRegisterError(error) {
            console.error('[SW] Error during registration:', error)
        }
    })

    const showUpdatePrompt = ref(false)

    // Watch needRefresh and update showUpdatePrompt
    watch(
        () => needRefresh.value,
        (newValue) => {
            if (newValue) {
                showUpdatePrompt.value = true
            }
        }
    )

    const checkForUpdates = () => {
        if (needRefresh.value) {
            showUpdatePrompt.value = true
        }
    }

    const reloadApp = async () => {
        showUpdatePrompt.value = false
        await updateServiceWorker(true)
    }

    const dismissUpdate = () => {
        showUpdatePrompt.value = false
    }

    return {
        offlineReady,
        needRefresh,
        showUpdatePrompt,
        checkForUpdates,
        reloadApp,
        dismissUpdate
    }
}
