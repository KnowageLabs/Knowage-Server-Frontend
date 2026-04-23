import type { IDynamicHomeTemplate, IMenuNode, IMenuPlaceholderConfig } from '@/modules/managers/homeManagement/HomeManagement'
import { normalizeMenuRoute } from '@/helpers/commons/menuHelper'

interface IDynamicHomePlaceholderMatch {
    openTag: string
    start: number
    end: number
    explicitIndex: number | null
}

interface IStringReplacement {
    start: number
    end: number
    text: string
}

const MENU_PLACEHOLDER_SELECTOR = '[data-kn-menu]'
const MENU_LABEL_SELECTOR = '[data-kn-label]'
const MENU_NAVIGATION_ATTRIBUTE = 'data-kn-menu-navigation'
const MENU_NAVIGATION_TYPE_ATTRIBUTE = 'data-kn-menu-navigation-type'
const MENU_PLACEHOLDER_BLOCK_PATTERN = /(<([a-zA-Z][a-zA-Z0-9]*)(?:\s[^>]*)?\sdata-kn-menu(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?(?:\s[^>]*)?>)([\s\S]*?)(<\/\2>)/g
const MENU_PLACEHOLDER_ATTRIBUTE_PATTERN = /\sdata-kn-menu(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/i
const HREF_ATTRIBUTE_PATTERN = /\shref=(?:"[^"]*"|'[^']*'|[^\s>]+)/i

export const DYNAMIC_HOME_NAVIGATION_SELECTOR = `[${MENU_NAVIGATION_ATTRIBUTE}]`

export interface IDynamicHomeNodeNavigation {
    type: 'to' | 'url'
    value: string
    href: string
}

function sanitizeDynamicHomeMenuIds(menuIds?: number[]): number[] {
    if (!Array.isArray(menuIds)) return []

    const sanitizedMenuIds: number[] = []
    const seenMenuIds = new Set<number>()

    for (const menuId of menuIds) {
        if (!Number.isInteger(menuId) || menuId < 0 || seenMenuIds.has(menuId)) continue

        sanitizedMenuIds.push(menuId)
        seenMenuIds.add(menuId)
    }

    return sanitizedMenuIds
}

function sanitizeDynamicHomePlaceholders(menuPlaceholders?: IMenuPlaceholderConfig[]): IMenuPlaceholderConfig[] {
    if (!Array.isArray(menuPlaceholders)) return []

    return menuPlaceholders.map((placeholder, position) => ({
        index: Number.isInteger(placeholder?.index) && placeholder.index >= 0 ? placeholder.index : position,
        menuIds: sanitizeDynamicHomeMenuIds(placeholder?.menuIds)
    }))
}

function hasLegacyDynamicHomePlaceholderIndexes(menuPlaceholders: IMenuPlaceholderConfig[]): boolean {
    return menuPlaceholders.some((placeholder) => placeholder.index === 0)
}

function getLegacyDynamicHomePlaceholderConfig(menuPlaceholders: IMenuPlaceholderConfig[], position: number): IMenuPlaceholderConfig | undefined {
    return menuPlaceholders.find((placeholder) => placeholder.index === position) ?? menuPlaceholders[position]
}

function getExplicitDynamicHomePlaceholderConfig(menuPlaceholders: IMenuPlaceholderConfig[], index: number, hasLegacyIndexes: boolean): IMenuPlaceholderConfig | undefined {
    if (hasLegacyIndexes) return getLegacyDynamicHomePlaceholderConfig(menuPlaceholders, index - 1)
    return menuPlaceholders.find((placeholder) => placeholder.index === index)
}

function getDynamicHomePlaceholderMatches(html: string): IDynamicHomePlaceholderMatch[] {
    const matches: IDynamicHomePlaceholderMatch[] = []
    const regex = new RegExp(MENU_PLACEHOLDER_BLOCK_PATTERN.source, 'g')

    let match: RegExpExecArray | null
    while ((match = regex.exec(html)) !== null) {
        const openTag = match[1]
        const rawBindingMatch = openTag.match(MENU_PLACEHOLDER_ATTRIBUTE_PATTERN)
        const rawBindingValue = rawBindingMatch?.[1] ?? rawBindingMatch?.[2] ?? rawBindingMatch?.[3]
        const parsedIndex = rawBindingValue !== undefined && rawBindingValue !== '' ? Number(rawBindingValue) : NaN

        matches.push({
            openTag,
            start: match.index,
            end: match.index + match[0].length,
            explicitIndex: Number.isInteger(parsedIndex) && parsedIndex > 0 ? parsedIndex : null
        })
    }

    return matches
}

function applyStringReplacements(text: string, replacements: IStringReplacement[]): string {
    let nextText = text

    for (let i = replacements.length - 1; i >= 0; i--) {
        const replacement = replacements[i]
        nextText = nextText.slice(0, replacement.start) + replacement.text + nextText.slice(replacement.end)
    }

    return nextText
}

function rewriteDynamicHomePlaceholderOpenTags(html: string, rewrite: (openTag: string) => string): string {
    const matches = getDynamicHomePlaceholderMatches(html)
    if (!matches.length) return html

    const replacements: IStringReplacement[] = []

    matches.forEach((match) => {
        const nextOpenTag = rewrite(match.openTag)
        if (nextOpenTag === match.openTag) return

        replacements.push({
            start: match.start,
            end: match.start + match.openTag.length,
            text: nextOpenTag
        })
    })

    return replacements.length ? applyStringReplacements(html, replacements) : html
}

function applyNodeLabel(node: Element, label: string) {
    const labelNode = node.matches(MENU_LABEL_SELECTOR) ? node : node.querySelector(MENU_LABEL_SELECTOR)
    if (labelNode) {
        labelNode.textContent = label
        return
    }

    if (node.textContent?.trim()) node.textContent = label
}

function applyNodeNavigation(node: Element, navigation: IDynamicHomeNodeNavigation | null) {
    if (!navigation) return

    node.setAttribute(MENU_NAVIGATION_ATTRIBUTE, navigation.value)
    node.setAttribute(MENU_NAVIGATION_TYPE_ATTRIBUTE, navigation.type)

    if (node.tagName.toLowerCase() === 'a') {
        node.setAttribute('href', navigation.href)
        return
    }

    if (!node.hasAttribute('role')) node.setAttribute('role', 'link')
    if (!node.hasAttribute('tabindex')) node.setAttribute('tabindex', '0')
}

export function getDynamicHomePlaceholderConfig(menuPlaceholders: IMenuPlaceholderConfig[] = [], index: number): IMenuPlaceholderConfig | undefined {
    return menuPlaceholders.find((placeholder) => placeholder.index === index)
}

function getDynamicHomeResolvedPlaceholderConfig(menuPlaceholders: IMenuPlaceholderConfig[] = [], explicitIndex: number | null, position: number): IMenuPlaceholderConfig | undefined {
    const sanitizedPlaceholders = sanitizeDynamicHomePlaceholders(menuPlaceholders)
    const hasLegacyIndexes = hasLegacyDynamicHomePlaceholderIndexes(sanitizedPlaceholders)

    if (explicitIndex !== null) return getExplicitDynamicHomePlaceholderConfig(sanitizedPlaceholders, explicitIndex, hasLegacyIndexes)
    return getLegacyDynamicHomePlaceholderConfig(sanitizedPlaceholders, position)
}

export function getNextDynamicHomePlaceholderIndex(menuPlaceholders: IMenuPlaceholderConfig[] = []): number {
    return menuPlaceholders.reduce((maxIndex, placeholder) => (placeholder.index > maxIndex ? placeholder.index : maxIndex), 0) + 1
}

export function addDefaultHrefToDynamicHomePlaceholders(html: string): string {
    return rewriteDynamicHomePlaceholderOpenTags(html, (openTag) => {
        if (HREF_ATTRIBUTE_PATTERN.test(openTag)) return openTag
        return openTag.replace(/>$/, ' href="#">')
    })
}

export function stripHrefFromDynamicHomePlaceholders(html: string): string {
    return rewriteDynamicHomePlaceholderOpenTags(html, (openTag) => openTag.replace(HREF_ATTRIBUTE_PATTERN, ''))
}

export function removeDynamicHomePlaceholderFromHtml(html: string, index: number): string {
    const matches = getDynamicHomePlaceholderMatches(html)
    const explicitTarget = matches.find((match) => match.explicitIndex === index)
    const fallbackTarget = !matches.some((match) => match.explicitIndex !== null) ? matches[index - 1] : undefined
    const target = explicitTarget ?? fallbackTarget

    if (!target) return html

    return html.slice(0, target.start) + html.slice(target.end)
}

export function normalizeDynamicHomeTemplate(template: IDynamicHomeTemplate | null | undefined, _options: { rewriteHtml?: boolean } = {}): IDynamicHomeTemplate {
    return {
        html: template?.html ?? '',
        css: template?.css ?? '',
        menuPlaceholders: sanitizeDynamicHomePlaceholders(template?.menuPlaceholders)
    }
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

export function getDynamicHomeNodeNavigation(node: IMenuNode | null | undefined, publicPath = ''): IDynamicHomeNodeNavigation | null {
    if (!node) return null
    if (node.to) {
        return {
            type: 'to',
            value: normalizeMenuRoute(node.to),
            href: resolveDynamicHomeNodeUrl(node, publicPath)
        }
    }
    if (node.url) {
        return {
            type: 'url',
            value: node.url,
            href: resolveDynamicHomeNodeUrl(node, publicPath)
        }
    }
    return null
}

export function renderDynamicHomeSrcdoc(template: IDynamicHomeTemplate | null | undefined, menuNodes: IMenuNode[] = [], publicPath = ''): string {
    if (!template) return ''

    const normalizedTemplate = normalizeDynamicHomeTemplate(template)
    const parser = new DOMParser()
    const doc = parser.parseFromString(normalizedTemplate.html ?? '', 'text/html')
    const flatNodes = flattenDynamicHomeMenuNodes(menuNodes)
    const placeholders = Array.from(doc.body.querySelectorAll(MENU_PLACEHOLDER_SELECTOR))

    placeholders.forEach((placeholder, position) => {
        const placeholderIndex = Number(placeholder.getAttribute('data-kn-menu'))
        const selectedMenuIds = getDynamicHomeResolvedPlaceholderConfig(
            normalizedTemplate.menuPlaceholders,
            Number.isInteger(placeholderIndex) && placeholderIndex > 0 ? placeholderIndex : null,
            position
        )?.menuIds ?? []
        const selectedNodes = flatNodes.filter((node) => selectedMenuIds.includes(node.menuId))

        if (!selectedNodes.length) {
            placeholder.remove()
            return
        }

        const generatedNodes = selectedNodes.map((node) => {
            const clone = placeholder.cloneNode(true) as Element
            clone.removeAttribute('data-kn-menu')
            applyNodeNavigation(clone, getDynamicHomeNodeNavigation(node, publicPath))
            applyNodeLabel(clone, node.descr || node.name || '')
            return clone
        })

        placeholder.replaceWith(...generatedNodes)
    })

    return `<style>${normalizedTemplate.css ?? ''}</style>\n${doc.body.innerHTML}`
}
