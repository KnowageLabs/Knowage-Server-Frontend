export function findFoldersWithLabel(items: any[] | undefined, label: string, result: any[] = []) {
    if (!items) return result
    for (const node of items) {
        if (node.label === label) result.push(node)
        if (node.children) findFoldersWithLabel(node.children, label, result)
    }
    return result
}

export function findNodesByLabelPath(items: any[] | undefined, path: string[], index = 0): any[] {
    if (!items || !path || path.length === 0) return []

    const startItems = index === 0 && items[0] && items[0].children ? items[0].children : items

    const label = path[index]
    const result: any[] = []

    for (const node of startItems) {
        if (node.label !== label) continue

        if (index === path.length - 1) {
            result.push(node)
        } else if (node.children) {
            const childMatches = findNodesByLabelPath(node.children, path, index + 1)
            if (childMatches && childMatches.length) result.push(...childMatches)
        }
    }

    return result
}

export interface IDocsRoleContext {
    // The role the reader is using. Without one, any of the user roles is enough.
    activeRole?: string
    userRoles?: string[]
}

// Hides the nodes the reader cannot see, with their subtree. A node whose children are all hidden is hidden too.
export function filterConfigByRoles(config: any, { activeRole, userRoles = [] }: IDocsRoleContext): any | null {
    const filterNode = (node: any): any | null => {
        if (node == null) return null
        if (Array.isArray(node)) return node.map(filterNode).filter((n) => n !== null)
        if (typeof node !== 'object') return node

        if (Array.isArray(node.roles) && node.roles.length > 0) {
            const canSee = activeRole ? node.roles.includes(activeRole) : userRoles.some((r) => node.roles.includes(r))
            if (!canSee) return null
        }

        const newNode: any = { ...node }
        if (Array.isArray(node.content)) {
            const filteredContent = node.content.map(filterNode).filter((n: any) => n !== null)
            if (filteredContent.length) {
                newNode.content = filteredContent
            } else {
                delete newNode.content
                if (node.content.length > 0) return null
            }
        }
        return newNode
    }
    return filterNode(config)
}

export function findSubfolder(folder: { children?: any[] } | null | undefined, segments: string[]): any | null {
    let current: any = folder
    for (const segment of segments) {
        current = current?.children?.find((child: any) => child.label === segment)
        if (!current) return null
    }
    return current ?? null
}

export function isRelativeUrl(url: string): boolean {
    return !!url && !/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(url)
}

// Resolves a link or an image of a page against the folder of that page. The result is relative to docs, or null when it leaves docs.
export function resolveDocsPath(pageFolder: string, reference: string): string | null {
    const clean = reference.split(/[?#]/)[0]
    let decoded = clean
    try {
        decoded = decodeURIComponent(clean)
    } catch {
        // keep the raw text
    }
    const segments: string[] = pageFolder ? pageFolder.split('/').filter(Boolean) : []
    for (const part of decoded.split('/')) {
        if (!part || part === '.') continue
        if (part === '..') {
            if (!segments.length) return null
            segments.pop()
        } else segments.push(part)
    }
    return segments.length ? segments.join('/') : null
}

export interface IDocsSiteNode {
    // The index path in the menu ("0.2.1"): stable while the config does not change.
    key: string
    label: string
    // Relative to docs, without the leading slash. Empty: the node only opens and closes its branch.
    path: string
    // A node with children, or with "header": true, uses the section style.
    section: boolean
    children: IDocsSiteNode[]
}

export interface IDocsSitePage {
    node: IDocsSiteNode
    // The labels of the parents, from the top.
    trail: string[]
}

// The menu of a filtered config, for the docs layout.
export function toSiteTree(items: any[] | undefined, prefix = ''): IDocsSiteNode[] {
    if (!Array.isArray(items)) return []
    return items
        .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
        .map((item, index) => {
            const key = prefix ? `${prefix}.${index}` : String(index)
            const children = toSiteTree(item.content, key)
            return {
                key,
                label: typeof item.label === 'string' ? item.label : '',
                path: typeof item.path === 'string' ? item.path.trim().replace(/^\/+/, '') : '',
                section: children.length > 0 || item.header === true,
                children
            }
        })
}

// The nodes with a page, in menu order (depth first): previous / next and search use this order.
export function sitePages(nodes: IDocsSiteNode[], trail: string[] = []): IDocsSitePage[] {
    return nodes.flatMap((node) => [...(node.path ? [{ node, trail }] : []), ...sitePages(node.children, [...trail, node.label])])
}

// The keys of the parents of the node that opens this path.
export function siteAncestorKeys(nodes: IDocsSiteNode[], path: string, parents: string[] = []): string[] | null {
    for (const node of nodes) {
        if (node.path === path) return parents
        const found = siteAncestorKeys(node.children, path, [...parents, node.key])
        if (found) return found
    }
    return null
}
