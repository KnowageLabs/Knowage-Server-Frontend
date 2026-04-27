import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockAxiosGet } = vi.hoisted(() => ({
    mockAxiosGet: vi.fn()
}))

vi.mock('@/axios.js', () => ({
    default: {
        get: mockAxiosGet
    }
}))

import Home from '../Home.vue'

describe('Home dynamic navigation', () => {
    const methods = (Home as any).methods

    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
    })

    function createContext(overrides: Record<string, any> = {}) {
        return {
            ...methods,
            homePage: {
                roleId: 7,
                template: {
                    html: '<div><button data-kn-menu><span data-kn-label>Menu Item</span></button></div>',
                    css: '',
                    menuPlaceholders: [{ index: 0, menuIds: [42] }]
                }
            },
            locale: 'it_IT',
            user: {
                defaultRole: null,
                attributes: {
                    roles: ''
                }
            },
            dynamicMenuNodes: [],
            dynamicSrcdoc: '',
            dynamicHomeSyntheticMenuId: -1,
            dynamicHomeFrameDocument: null,
            setHomePage: vi.fn(),
            $i18n: {
                fallbackLocale: {
                    toString: () => 'en-US'
                }
            },
            $router: {
                push: vi.fn()
            },
            $refs: {},
            ...overrides
        }
    }

    it('loads runtime dynamic menu items from end-user and maps them to configured preview ids', async () => {
        mockAxiosGet
            .mockResolvedValueOnce({
                data: {
                    dynamicUserFunctionalities: [
                        {
                            label: 'Dashboard',
                            descr: 'Dashboard',
                            to: '\\/document-browser'
                        }
                    ]
                }
            })
            .mockResolvedValueOnce({
                data: [
                    {
                        menuId: 42,
                        name: 'Dashboard',
                        descr: 'Dashboard',
                        url: null,
                        to: '\\/document-browser',
                        linkType: null
                    }
                ]
            })

        const context = createContext()

        await methods.buildDynamicSrcdoc.call(context)

        expect(mockAxiosGet).toHaveBeenNthCalledWith(1, '/knowage/restful-services/3.0/menu/enduser?locale=it-IT')
        expect(mockAxiosGet).toHaveBeenNthCalledWith(2, '/knowage/restful-services/2.0/menu/preview/7')
        expect(context.dynamicMenuNodes).toEqual([
            {
                menuId: 42,
                name: 'Dashboard',
                descr: 'Dashboard',
                url: null,
                to: '\\/document-browser',
                linkType: null,
                children: []
            }
        ])

        const doc = new DOMParser().parseFromString(context.dynamicSrcdoc, 'text/html')
        const button = doc.querySelector('button')

        expect(button?.getAttribute('data-kn-menu-navigation')).toBe('/document-browser')
        expect(button?.textContent).toBe('Dashboard')
    })

    it('routes dynamic home menu clicks through the Vue router', () => {
        const context = createContext()
        const button = document.createElement('button')
        button.setAttribute('data-kn-menu-navigation', '/document-browser')
        button.setAttribute('data-kn-menu-navigation-type', 'to')

        methods.navigateDynamicHomeElement.call(context, button)

        expect(context.$router.push).toHaveBeenCalledWith('/document-browser')
    })

    it('wraps external urls with the internal iframe route when navigating from dynamic home', () => {
        const context = createContext()
        const button = document.createElement('button')
        button.setAttribute('data-kn-menu-navigation', 'https://example.com')
        button.setAttribute('data-kn-menu-navigation-type', 'url')

        methods.navigateDynamicHomeElement.call(context, button)

        expect(context.$router.push).toHaveBeenCalledWith({ name: 'externalUrl', params: { url: 'https://example.com' } })
    })

    it('intercepts clicks from nested elements inside custom placeholders', () => {
        const context = createContext()
        const button = document.createElement('button')
        button.setAttribute('data-kn-menu-navigation', '/workspace')
        button.setAttribute('data-kn-menu-navigation-type', 'to')
        const child = document.createElement('span')
        button.appendChild(child)
        const preventDefault = vi.fn()

        methods.onDynamicHomeDocumentClick.call(context, {
            target: child,
            preventDefault
        })

        expect(preventDefault).toHaveBeenCalled()
        expect(context.$router.push).toHaveBeenCalledWith('/workspace')
    })

    it('builds homepage document routes using the resolved document type', async () => {
        mockAxiosGet
            .mockResolvedValueOnce({ data: [] })
            .mockResolvedValueOnce({
                data: {
                    type: 'document',
                    documentId: 42,
                    documentLabel: 'Sales'
                }
            })
            .mockResolvedValueOnce({
                data: {
                    label: 'Sales',
                    typeCode: 'DASHBOARD'
                }
            })

        const setHomePage = vi.fn()
        const context = createContext({ setHomePage })

        await methods.loadHomePage.call(context)

        expect(mockAxiosGet).toHaveBeenNthCalledWith(3, '/knowage/restful-services/2.0/documents/42', { headers: { 'X-Disable-Errors': 'true' } })
        expect(setHomePage).toHaveBeenCalledWith(
            expect.objectContaining({
                label: 'Sales',
                to: '/dashboard/Sales',
                documentRouteType: 'dashboard'
            })
        )
    })

    it('routes supported homepage document paths through the Vue router', async () => {
        const context = createContext({
            homePage: {
                to: '/dashboard/Sales'
            }
        })

        await methods.setCompleteUrl.call(context)

        expect(context.$router.push).toHaveBeenCalledWith('/dashboard/Sales')
    })
})
