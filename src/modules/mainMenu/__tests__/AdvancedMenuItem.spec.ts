import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h, nextTick } from 'vue'
import useMainStore from '@/App.store'
import AdvancedMenuItem from '../AdvancedMenuItem.vue'

vi.mock('vue-router', () => ({ useRoute: () => ({ path: '/' }) }))
vi.mock('quasar', () => ({ useQuasar: () => ({ screen: { lt: { md: false } } }) }))
vi.mock('../AdvancedMainMenuHelper', () => ({
    getInternationalizedValue: (item: { label: string }) => item.label,
    cleanUrl: () => undefined,
    normalizeExternalUrl: (url: string) => url
}))

const renderDownloadItem = (initialCount: number) => {
    setActivePinia(createPinia())
    const store = useMainStore()
    store.setDownloads({ count: { total: initialCount, alreadyDownloaded: 0 } })
    const item = { label: 'Downloads', command: 'downloadsSelection', badge: initialCount }
    const wrapper = mount(
        defineComponent({
            setup: () => () => h(AdvancedMenuItem, { item, badge: store.downloads.count.total - store.downloads.count.alreadyDownloaded })
        }),
        {
            global: {
                stubs: {
                    QBtn: { template: '<button><slot /></button>' },
                    QBadge: { template: '<span data-test="download-count"><slot /></span>' },
                    QAvatar: true,
                    QIcon: true,
                    QTooltip: true,
                    QMenu: true,
                    AdvancedMenuSubItem: true
                }
            }
        }
    )
    return { wrapper, store }
}

describe('download menu counter', () => {
    it('shows the first background download when the store receives an updated count', async () => {
        const { wrapper, store } = renderDownloadItem(0)
        expect(wrapper.find('[data-test="download-count"]').exists()).toBe(false)

        store.setDownloads({ count: { total: 1, alreadyDownloaded: 0 } })
        await nextTick()

        expect(wrapper.get('[data-test="download-count"]').text()).toBe('1')
        wrapper.unmount()
    })

    it('updates an existing count and hides it when all files have been downloaded', async () => {
        const { wrapper, store } = renderDownloadItem(1)
        expect(wrapper.get('[data-test="download-count"]').text()).toBe('1')

        store.setDownloads({ count: { total: 2, alreadyDownloaded: 0 } })
        await nextTick()
        expect(wrapper.get('[data-test="download-count"]').text()).toBe('2')

        store.updateAlreadyDownloadedFiles()
        await nextTick()
        expect(wrapper.get('[data-test="download-count"]').text()).toBe('1')

        store.updateAlreadyDownloadedFiles()
        await nextTick()
        expect(wrapper.find('[data-test="download-count"]').exists()).toBe(false)
        wrapper.unmount()
    })

    it('removes the badge when the download list is cleared', async () => {
        const { wrapper, store } = renderDownloadItem(2)

        store.setDownloads({ count: { total: 0, alreadyDownloaded: 0 } })
        await nextTick()

        expect(wrapper.find('[data-test="download-count"]').exists()).toBe(false)
        wrapper.unmount()
    })
})
