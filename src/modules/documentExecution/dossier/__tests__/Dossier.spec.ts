import { describe, expect, it, vi } from 'vitest'
import Dossier from '../Dossier.vue'

describe('Dossier template actions', () => {
    const methods = (Dossier as any).methods
    const computed = (Dossier as any).computed

    function createContext(jsonTemplate: Record<string, unknown> = {}) {
        return {
            ...methods,
            jsonTemplate,
            $t: (key: string) => key,
            setUploadType: vi.fn(),
            downloadTemplate: vi.fn()
        }
    }

    it('treats string false template options as disabled', () => {
        const context = createContext({
            PPT_TEMPLATE: {
                uploadable: 'false',
                downloadable: 'false'
            }
        })

        expect(methods.templateOptionEnabled.call(context, 'uploadable')).toBe(false)
        expect(methods.templateOptionEnabled.call(context, 'downloadable')).toBe(false)

        const menuButtons = computed.menuButtons.call(context)
        const visibleMenuButtons = computed.visibleMenuButtons.call({ menuButtons })

        expect(visibleMenuButtons).toEqual([])
        expect(computed.hasTemplateOptions.call({ visibleMenuButtons })).toBe(false)
    })

    it('shows only the template actions enabled by normalized flags', () => {
        const context = createContext({
            DOC_TEMPLATE: {
                uploadable: 'true',
                downloadable: false
            }
        })

        const menuButtons = computed.menuButtons.call(context)
        const visibleMenuButtons = computed.visibleMenuButtons.call({ menuButtons })

        expect(menuButtons.map((button) => button.visible)).toEqual([true, false])
        expect(visibleMenuButtons.map((button) => button.key)).toEqual(['1'])
        expect(computed.hasTemplateOptions.call({ visibleMenuButtons })).toBe(true)
    })
})
