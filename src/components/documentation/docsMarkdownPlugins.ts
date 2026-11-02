// markdown-it plugins of the docs renderer (spec 14.6 E7, 14.7). Our own code: no extra package.

export const CALLOUT_TYPES = ['note', 'tip', 'important', 'warning', 'caution'] as const
export type iDocsCalloutType = (typeof CALLOUT_TYPES)[number]

export interface iDocsHeading {
    id: string
    text: string
    level: number
}

const MARKER = /^\[!(note|tip|important|warning|caution)\]\s*$/i

export function docsSlug(text: string): string {
    return (
        text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'section'
    )
}

// GitHub alerts: a quote whose first line is [!TYPE] becomes a callout. Any other quote stays a plain quote.
export function docsCallouts(md: any, options: { title: (type: iDocsCalloutType) => string }) {
    // After text_join, so the marker is one text token.
    md.core.ruler.push('docs_callouts', (state: any) => {
        const tokens = state.tokens
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].type !== 'blockquote_open' || tokens[i + 1]?.type !== 'paragraph_open' || tokens[i + 2]?.type !== 'inline') continue
            const inline = tokens[i + 2]
            const children = inline.children ?? []
            const breakAt = children.findIndex((child: any) => child.type === 'softbreak' || child.type === 'hardbreak')
            const firstLine = breakAt === -1 ? children : children.slice(0, breakAt)
            if (firstLine.some((child: any) => child.type !== 'text')) continue
            const match = MARKER.exec(firstLine.map((child: any) => child.content).join(''))
            if (!match) continue

            const type = match[1].toLowerCase() as iDocsCalloutType
            tokens[i].attrJoin('class', `docs-callout docs-callout--${type}`)
            if (breakAt === -1) {
                // The marker is the whole paragraph: drop the paragraph.
                tokens.splice(i + 1, 3)
            } else {
                inline.children = children.slice(breakAt + 1)
                inline.content = inline.content.replace(/^[^\n]*\n/, '')
            }

            const titleOpen = new state.Token('paragraph_open', 'p', 1)
            titleOpen.attrSet('class', 'docs-callout__title')
            const titleText = new state.Token('text', '', 0)
            titleText.content = options.title(type)
            const titleInline = new state.Token('inline', '', 0)
            titleInline.content = titleText.content
            titleInline.children = [titleText]
            tokens.splice(i + 1, 0, titleOpen, titleInline, new state.Token('paragraph_close', 'p', -1))
        }
    })
}

// Ids on h2 to h4 (unique on the page) and a "#" link before the text.
export function docsHeadingAnchors(md: any) {
    md.core.ruler.push('docs_heading_anchors', (state: any) => {
        const used = new Map<string, number>()
        const tokens = state.tokens
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i]
            if (token.type !== 'heading_open' || !['h2', 'h3', 'h4'].includes(token.tag)) continue
            const inline = tokens[i + 1]
            const base = docsSlug(inline.content)
            const count = used.get(base) ?? 0
            used.set(base, count + 1)
            const id = count ? `${base}-${count}` : base
            token.attrSet('id', id)

            const anchor = new state.Token('html_inline', '', 0)
            anchor.content = `<a class="docs-anchor" href="#${id}" aria-hidden="true">#</a>`
            inline.children = [anchor, ...(inline.children ?? [])]
        }
    })
}

// A wrapper per table: a wide table scrolls inside it, not the page.
export function docsTables(md: any) {
    md.renderer.rules.table_open = () => '<div class="docs-table"><table>\n'
    md.renderer.rules.table_close = () => '</table></div>\n'
}
