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

export function mapToQTreeNodes(items: any[], level = 1): any[] {
    if (!items) return []
    return items.map((item) => {
        const id = crypto.randomUUID()
        const isSection = level === 1 || item.header === true
        return {
            id,
            label: item.label,
            path: item.path,
            level,
            ...(isSection ? { header: 'section' } : {}),
            ...(item.content?.length ? { children: mapToQTreeNodes(item.content, level + 1) } : {})
        }
    })
}
