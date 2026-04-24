import { beforeEach, describe, expect, it, vi } from 'vitest'

import MainMenu from '../MainMenu.vue'

describe('MainMenu home navigation', () => {
    const methods = (MainMenu as any).methods

    beforeEach(() => {
        vi.clearAllMocks()
    })

    function createContext(overrides: Record<string, any> = {}) {
        return {
            ...methods,
            adminMenuOpened: false,
            allowedUserFunctionalities: [],
            commonUserFunctionalities: [],
            dynamicUserFunctionalities: [],
            downloads: {},
            news: {},
            locale: 'it_IT',
            user: {
                configuration: {
                    'home.button.url': 'https://legacy.example.com/old-home'
                }
            },
            $router: {
                push: vi.fn()
            },
            $refs: {
                menu: {
                    hide: vi.fn()
                }
            },
            $http: {
                get: vi.fn()
            },
            $i18n: {
                fallbackLocale: {
                    toString: () => 'en-US'
                }
            },
            $t: vi.fn((key: string) => key),
            setLoading: vi.fn(),
            setConditionedVisibility: vi.fn(),
            isItemToDisplay: vi.fn(() => true),
            updateNewsAndDownload: vi.fn(),
            hideItemMenu: vi.fn(),
            logout: vi.fn(),
            toggleMenuOpened: vi.fn(),
            ...overrides
        }
    }

    it('routes Home clicks through the home route instead of the legacy configured url', () => {
        const context = createContext()
        const navigate = vi.fn()

        methods.itemClick.call(context, {
            item: { label: 'Home', to: '/legacy-home' },
            navigate,
            originalEvent: {}
        })

        expect(context.$router.push).toHaveBeenCalledWith({ name: 'home' })
        expect(navigate).not.toHaveBeenCalled()
        expect(context.hideItemMenu).toHaveBeenCalled()
    })

    it('keeps using the provided navigate callback for non-home internal items', () => {
        const context = createContext()
        const navigate = vi.fn()
        const originalEvent = { type: 'click' }

        methods.itemClick.call(context, {
            item: { label: 'Documents', to: '/document-browser' },
            navigate,
            originalEvent
        })

        expect(navigate).toHaveBeenCalledWith(originalEvent)
        expect(context.$router.push).not.toHaveBeenCalled()
    })

    it('normalizes the Home common menu item to the shared home route when loading the menu', async () => {
        const get = vi.fn().mockResolvedValue({
            data: {
                technicalUserFunctionalities: [],
                allowedUserFunctionalities: [],
                dynamicUserFunctionalities: [],
                commonUserFunctionalities: [
                    {
                        label: 'Home',
                        to: '/document-composite/execute?label=Sales',
                        url: 'https://legacy.example.com/old-home',
                        target: '_blank'
                    },
                    {
                        label: 'Logout',
                        command: 'logout'
                    }
                ]
            }
        })

        const context = createContext({
            $http: { get }
        })

        await methods.loadMenu.call(context)

        expect(get).toHaveBeenCalledWith('/knowage/restful-services/3.0/menu/enduser?locale=it-IT')
        expect(context.commonUserFunctionalities[0]).toMatchObject({
            label: 'Home',
            to: '/',
            visible: true
        })
        expect(context.commonUserFunctionalities[0].url).toBeUndefined()
        expect(context.commonUserFunctionalities[0].target).toBeUndefined()
    })
})
