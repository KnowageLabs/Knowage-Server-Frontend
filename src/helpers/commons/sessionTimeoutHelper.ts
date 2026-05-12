import { Notify } from 'quasar'
import i18n from '@/App.i18n'
import axios from '@/axios.js'
import authHelper from '@/helpers/commons/authHelper'

let interval: ReturnType<typeof setInterval> | null = null
let warningShown = false
let warningDismiss: (() => void) | null = null

function stop(): void {
    if (interval) {
        clearInterval(interval)
        interval = null
    }
    warningShown = false
    if (warningDismiss) {
        warningDismiss()
        warningDismiss = null
    }
}

function start(configurations: Record<string, any>): void {
    if (localStorage.getItem('public')) return

    // Read configured timeout — explicit 0 (or negative) means "disabled"
    const rawTimeout = configurations['KNOWAGE.SESSION_TIMEOUT']
    const timeout =
        rawTimeout !== undefined && rawTimeout !== null && rawTimeout !== ''
            ? Number(rawTimeout)
            : Number(import.meta.env.VITE_SESSION_TIMEOUT || 1800000)

    localStorage.setItem('sessionTimeoutMs', String(timeout))

    if (timeout <= 0) return  // feature disabled by configuration

    const warningAdvance = Number(configurations['KNOWAGE.SESSION_WARNING_ADVANCE'] || 300000)

    stop()

    interval = setInterval(() => {
        const lastTs = localStorage.getItem('lastResponseTimestamp')
        if (!lastTs) return
        const elapsed = Date.now() - Number(lastTs)

        if (elapsed >= timeout) {
            stop()
            localStorage.removeItem('token')
            localStorage.removeItem('lastResponseTimestamp')
            localStorage.removeItem('sessionTimeoutMs')
            authHelper.logout()
        } else if (elapsed >= timeout - warningAdvance && !warningShown) {
            warningShown = true
            warningDismiss = Notify.create({
                type: 'warning',
                message: i18n.global.t('common.session.expiring'),
                position: 'top',
                timeout: 0,
                actions: [
                    {
                        label: i18n.global.t('common.session.stayConnected'),
                        color: 'black',
                        handler: () => {
                            axios.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/currentuser')
                            warningShown = false
                            warningDismiss = null
                        }
                    }
                ]
            })
        } else if (elapsed < timeout - warningAdvance && warningShown) {
            warningShown = false
            if (warningDismiss) {
                warningDismiss()
                warningDismiss = null
            }
        }
    }, 30000)
}

export default { start, stop }
