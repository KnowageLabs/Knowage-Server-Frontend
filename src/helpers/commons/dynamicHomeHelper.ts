import type { IDynamicHomeTemplate, IMenuNode } from '@/modules/managers/homeManagement/HomeManagement'

const MENU_PLACEHOLDER_SELECTOR = '[data-kn-menu]'
const MENU_LABEL_SELECTOR = '[data-kn-label]'

function getPlaceholderConfig(template: IDynamicHomeTemplate, index: number) {
    return template.menuPlaceholders?.find((placeholder) => placeholder.index === index) ?? template.menuPlaceholders?.[index]
}

function applyNodeLabel(node: Element, label: string) {
    const labelNode = node.matches(MENU_LABEL_SELECTOR) ? node : node.querySelector(MENU_LABEL_SELECTOR)
    if (labelNode) {
        labelNode.textContent = label
        return
    }

    if (node.textContent?.trim()) node.textContent = label
}

export function flattenDynamicHomeMenuNodes(nodes: IMenuNode[]): IMenuNode[] {
    const result: IMenuNode[] = []
    const walk = (items: IMenuNode[]) => {
        for (const item of items) {
            result.push(item)
            const children = item.lstChildren?.length ? item.lstChildren : (item.children ?? [])
            if (children.length) walk(children)
        }
    }

    walk(nodes)
    return result
}

export function resolveDynamicHomeNodeUrl(node: IMenuNode | null | undefined, publicPath = ''): string {
    if (!node) return '#'
    if (node.to) return publicPath + node.to.replace(/\\\//g, '/')
    if (node.url) return node.url
    return '#'
}

export function renderDynamicHomeSrcdoc(template: IDynamicHomeTemplate | null | undefined, menuNodes: IMenuNode[] = [], publicPath = ''): string {
    if (!template) return ''

    const parser = new DOMParser()
    const doc = parser.parseFromString(template.html ?? '', 'text/html')
    const flatNodes = flattenDynamicHomeMenuNodes(menuNodes)
    const placeholders = Array.from(doc.body.querySelectorAll(MENU_PLACEHOLDER_SELECTOR))

    placeholders.forEach((placeholder, index) => {
        const selectedMenuIds = getPlaceholderConfig(template, index)?.menuIds ?? []
        const selectedNodes = flatNodes.filter((node) => selectedMenuIds.includes(node.menuId))

        if (!selectedNodes.length) {
            placeholder.remove()
            return
        }

        const generatedNodes = selectedNodes.map((node) => {
            const clone = placeholder.cloneNode(true) as Element
            clone.removeAttribute('data-kn-menu')
            clone.setAttribute('href', resolveDynamicHomeNodeUrl(node, publicPath))
            applyNodeLabel(clone, node.descr || node.name || '')
            return clone
        })

        placeholder.replaceWith(...generatedNodes)
    })

    return `<style>${template.css ?? ''}</style>\n${doc.body.innerHTML}`
}
