import { ref } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

export const useServiceWorker = () => {
    const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
        immediate: true,
        onRegistered(registration) {
            console.log('[SW] Service Worker registered successfully:', registration)

            if (registration) {
                setInterval(
                    () => {
                        registration.update()
                    },
                    60 * 60 * 1000
                )
            }
        },
        onRegisterError(error) {
            console.error('[SW] Error during registration:', error)
        }
    })

    const showUpdatePrompt = ref(false)

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
