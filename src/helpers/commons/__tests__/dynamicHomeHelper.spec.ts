import { describe, expect, it } from 'vitest'
import {
    addDefaultHrefToDynamicHomePlaceholders,
    flattenDynamicHomeMenuNodes,
    getNextDynamicHomePlaceholderIndex,
    normalizeDynamicHomeTemplate,
    removeDynamicHomePlaceholderFromHtml,
    renderDynamicHomeSrcdoc,
    resolveDynamicHomeNodeUrl,
    stripHrefFromDynamicHomePlaceholders
} from '../dynamicHomeHelper'
import type { IDynamicHomeTemplate, IMenuNode } from '@/modules/managers/homeManagement/HomeManagement'

const menuNodes: IMenuNode[] = [
    {
        menuId: 1,
        name: 'Dashboard',
        descr: 'Dashboard',
        url: null,
        to: '\\/document-browser',
        linkType: null,
        lstChildren: [
            {
                menuId: 2,
                name: 'Workspace',
                descr: 'Workspace',
                url: null,
                to: '\\/workspace',
                linkType: null
            }
        ]
    },
    {
        menuId: 3,
        name: 'External',
        descr: null,
        url: 'https://example.com',
        to: null,
        linkType: null
    }
]

describe('flattenDynamicHomeMenuNodes', () => {
    it('flattens menu trees using lstChildren and children collections', () => {
        const nodes = flattenDynamicHomeMenuNodes([
            menuNodes[0],
            {
                menuId: 4,
                name: 'Folder',
                descr: 'Folder',
                url: null,
                to: null,
                linkType: null,
                children: [
                    {
                        menuId: 5,
                        name: 'Child',
                        descr: 'Child',
                        url: null,
                        to: '\\/child',
                        linkType: null
                    }
                ]
            }
        ])

        expect(nodes.map((node) => node.menuId)).toEqual([1, 2, 4, 5])
    })
})

describe('resolveDynamicHomeNodeUrl', () => {
    it('resolves router targets with the configured public path', () => {
        expect(resolveDynamicHomeNodeUrl(menuNodes[0], '/knowage-vue')).toBe('/knowage-vue/document-browser')
    })

    it('falls back to direct urls or # when no target exists', () => {
        expect(resolveDynamicHomeNodeUrl(menuNodes[1], '/knowage-vue')).toBe('https://example.com')
        expect(resolveDynamicHomeNodeUrl({ ...menuNodes[1], url: null }, '/knowage-vue')).toBe('#')
        expect(resolveDynamicHomeNodeUrl(undefined, '/knowage-vue')).toBe('#')
    })
})

describe('normalizeDynamicHomeTemplate', () => {
    it('normalizes legacy placeholders to explicit 1-based bindings preserving current behavior', () => {
        const template: IDynamicHomeTemplate = {
            html: '<div><a data-kn-menu>First</a><a data-kn-menu>Second</a></div>',
            css: '',
            menuPlaceholders: [
                { index: 1, menuIds: [3] },
                { index: 0, menuIds: [1] }
            ]
        }

        const normalized = normalizeDynamicHomeTemplate(template, { rewriteHtml: true })

        expect(normalized.html).toContain('data-kn-menu="1"')
        expect(normalized.html).toContain('data-kn-menu="2"')
        expect(normalized.menuPlaceholders).toEqual([
            { index: 1, menuIds: [1] },
            { index: 2, menuIds: [3] }
        ])
    })

    it('binds explicit placeholder ids to legacy 0-based configurations after normalization', () => {
        const template: IDynamicHomeTemplate = {
            html: '<div><a data-kn-menu="2">Second</a><a data-kn-menu="1">First</a></div>',
            css: '',
            menuPlaceholders: [
                { index: 0, menuIds: [1] },
                { index: 1, menuIds: [3] }
            ]
        }

        const normalized = normalizeDynamicHomeTemplate(template)

        expect(normalized.menuPlaceholders).toEqual([
            { index: 2, menuIds: [3] },
            { index: 1, menuIds: [1] }
        ])
    })

    it('keeps stable ids and assigns new ones without reusing holes', () => {
        const template: IDynamicHomeTemplate = {
            html: '<div><a data-kn-menu="1">One</a><a data-kn-menu="4">Four</a><a data-kn-menu>New</a></div>',
            css: '',
            menuPlaceholders: [
                { index: 1, menuIds: [1] },
                { index: 4, menuIds: [3] }
            ]
        }

        const normalized = normalizeDynamicHomeTemplate(template, { rewriteHtml: true })

        expect(normalized.html).toContain('data-kn-menu="1"')
        expect(normalized.html).toContain('data-kn-menu="4"')
        expect(normalized.html).toContain('data-kn-menu="5"')
        expect(getNextDynamicHomePlaceholderIndex(normalized.menuPlaceholders)).toBe(6)
    })
})

describe('dynamic home html helpers', () => {
    it('adds and strips href without affecting placeholder bindings', () => {
        expect(addDefaultHrefToDynamicHomePlaceholders('<div><a data-kn-menu="3">Menu</a></div>')).toBe('<div><a data-kn-menu="3" href="#">Menu</a></div>')
        expect(stripHrefFromDynamicHomePlaceholders('<div><a class="item" href="#" data-kn-menu="3">Menu</a></div>')).toBe('<div><a class="item" data-kn-menu="3">Menu</a></div>')
    })

    it('removes a specific placeholder from the html by binding id', () => {
        expect(removeDynamicHomePlaceholderFromHtml('<div><a data-kn-menu="1">First</a><a data-kn-menu="4">Fourth</a></div>', 4)).toBe('<div><a data-kn-menu="1">First</a></div>')
    })
})

describe('renderDynamicHomeSrcdoc', () => {
    it('injects href and labels for selected menu placeholders', () => {
        const template: IDynamicHomeTemplate = {
            html: '<div><a data-kn-menu><span data-kn-label>Menu Item</span></a></div>',
            css: 'a { color: red; }',
            menuPlaceholders: [{ index: 0, menuIds: [1, 2] }]
        }

        const srcdoc = renderDynamicHomeSrcdoc(template, menuNodes, '/knowage-vue')
        const doc = new DOMParser().parseFromString(srcdoc, 'text/html')
        const links = Array.from(doc.querySelectorAll('a'))

        expect(doc.querySelector('style')?.textContent).toBe('a { color: red; }')
        expect(links).toHaveLength(2)
        expect(links[0].getAttribute('href')).toBe('/knowage-vue/document-browser')
        expect(links[0].textContent).toBe('Dashboard')
        expect(links[1].getAttribute('href')).toBe('/knowage-vue/workspace')
        expect(links[1].textContent).toBe('Workspace')
    })

    it('uses explicit placeholder ids instead of relying on array order', () => {
        const template: IDynamicHomeTemplate = {
            html: '<div><a data-kn-menu="2">Second</a><a data-kn-menu="1">First</a></div>',
            css: '',
            menuPlaceholders: [
                { index: 1, menuIds: [1] },
                { index: 2, menuIds: [3] }
            ]
        }

        const srcdoc = renderDynamicHomeSrcdoc(template, menuNodes, '/knowage-vue')
        const doc = new DOMParser().parseFromString(srcdoc, 'text/html')
        const links = Array.from(doc.querySelectorAll('a'))

        expect(links).toHaveLength(2)
        expect(links[0].textContent).toBe('External')
        expect(links[0].getAttribute('href')).toBe('https://example.com')
        expect(links[1].textContent).toBe('Dashboard')
    })

    it('keeps rendering legacy templates without explicit binding values', () => {
        const template: IDynamicHomeTemplate = {
            html: '<div><a data-kn-menu>First</a><a data-kn-menu>Second</a></div>',
            css: '',
            menuPlaceholders: [
                { index: 1, menuIds: [3] },
                { index: 0, menuIds: [1] }
            ]
        }

        const srcdoc = renderDynamicHomeSrcdoc(template, menuNodes, '/knowage-vue')
        const doc = new DOMParser().parseFromString(srcdoc, 'text/html')
        const links = Array.from(doc.querySelectorAll('a'))

        expect(links).toHaveLength(2)
        expect(links[0].textContent).toBe('Dashboard')
        expect(links[1].textContent).toBe('External')
    })

    it('removes placeholders when no menu items are selected or available', () => {
        const template: IDynamicHomeTemplate = {
            html: '<section><a data-kn-menu>Menu Item</a><p>Static</p></section>',
            css: '',
            menuPlaceholders: [{ index: 0, menuIds: [] }]
        }

        const srcdoc = renderDynamicHomeSrcdoc(template, menuNodes, '/knowage-vue')
        const doc = new DOMParser().parseFromString(srcdoc, 'text/html')

        expect(doc.querySelector('a')).toBeNull()
        expect(doc.querySelector('p')?.textContent).toBe('Static')
    })
})
