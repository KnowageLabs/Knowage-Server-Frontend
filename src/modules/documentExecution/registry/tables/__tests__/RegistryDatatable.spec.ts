import { defineComponent, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import RegistryDatatable from '../RegistryDatatable.vue'

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key: string) => key
    })
}))

vi.mock('quasar', () => ({
    QToolbar: defineComponent({ template: '<div><slot /></div>' }),
    QChip: defineComponent({ template: '<div><slot /></div>' }),
    QBtn: defineComponent({ template: '<button><slot /></button>' }),
    QTooltip: defineComponent({ template: '<div><slot /></div>' }),
    QSpace: defineComponent({ template: '<div />' }),
    QSeparator: defineComponent({ template: '<div />' }),
    QLinearProgress: defineComponent({ template: '<div />' }),
    QPagination: defineComponent({
        name: 'QPagination',
        emits: ['update:model-value'],
        template: '<button data-test="registry-paginator" @click="$emit(\'update:model-value\', 2)" />'
    }),
    useQuasar: () => ({
        dialog: () => ({
            onOk: () => undefined
        })
    })
}))

vi.mock('../../composables/useRegistryColumnOptions', () => ({
    useRegistryColumnOptions: () => ({
        comboColumnOptions: ref({}),
        addColumnOptions: vi.fn()
    })
}))

const globalConfig = {
    mocks: {
        $t: (key: string) => key
    },
    stubs: {
        'q-toolbar': { template: '<div><slot /></div>' },
        'q-chip': { template: '<div><slot /></div>' },
        'q-btn': { template: '<button><slot /></button>' },
        'q-tooltip': { template: '<div><slot /></div>' },
        'q-space': { template: '<div />' },
        'q-separator': { template: '<div />' },
        'q-linear-progress': { template: '<div />' },
        RegistryGrid: defineComponent({
            template: '<div data-test="registry-grid" />',
            methods: {
                getSelectedRows() {
                    return []
                },
                clearSelectedRows() {
                    return []
                }
            }
        }),
        RegistryDatatableWarningDialog: {
            template: '<div />'
        }
    }
}

function createWrapper(pagination = { enabled: true, start: 0, limit: 20, size: 60 }) {
    return mount(RegistryDatatable, {
        props: {
            propColumns: [],
            propRows: [],
            propConfiguration: [],
            pagination,
            stopWarningsState: []
        },
        global: globalConfig
    })
}

describe('RegistryDatatable pagination', () => {
    it('shows the bottom paginator only when the registry pagination config enables it', async () => {
        const enabledWrapper = createWrapper()
        const disabledWrapper = createWrapper({ enabled: false, start: 0, limit: 20, size: 60 })

        await enabledWrapper.vm.$nextTick()
        await disabledWrapper.vm.$nextTick()

        expect(enabledWrapper.find('[data-test="registry-paginator"]').exists()).toBe(true)
        expect(disabledWrapper.find('[data-test="registry-paginator"]').exists()).toBe(false)
    })

    it('emits explicit page navigation requests from the paginator', async () => {
        const wrapper = createWrapper()
        await wrapper.vm.$nextTick()

        await wrapper.find('[data-test="registry-paginator"]').trigger('click')

        expect(wrapper.emitted('pageChanged')?.[0]).toEqual([
            {
                paginationStart: 20,
                paginationLimit: 20,
                paginationEnd: 40,
                size: 60,
                enabled: true
            }
        ])
    })
})
