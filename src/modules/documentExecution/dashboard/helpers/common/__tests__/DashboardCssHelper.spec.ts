import { describe, expect, it } from 'vitest'
import { composeCssWithHoistedImports, scopeDashboardCssToContainer } from '../DashboardCssHelper'

const normalizeCss = (css: string) => css.replace(/\s+/g, '').trim()

describe('composeCssWithHoistedImports', () => {
    it('hoists imports before all CSS blocks while preserving body order', () => {
        const result = composeCssWithHoistedImports(
            ".dashboard-link { color: red; }\n@import url('https://fonts.example/dashboard.css');",
            'body { margin: 0; }',
            ".material-symbols-outlined { font-size: 30px; }\n@import url('https://fonts.example/widget.css');\na { color: white; }"
        )

        expect(normalizeCss(result)).toBe(
            normalizeCss(
                "@import url('https://fonts.example/dashboard.css');\n@import url('https://fonts.example/widget.css');\n.dashboard-link { color: red; }\nbody { margin: 0; }\n.material-symbols-outlined { font-size: 30px; }\na { color: white; }"
            )
        )
    })

    it('does not duplicate widget CSS during composition', () => {
        const result = composeCssWithHoistedImports("@import url('https://fonts.example/dashboard.css');", '.material-symbols-outlined { font-size: 30px; }')
        expect((result.match(/material-symbols-outlined/g) ?? []).length).toBe(1)
    })
})

describe('scopeDashboardCssToContainer', () => {
    it('scopes regular selectors and root selectors to the dashboard renderer container', () => {
        const scopeSelector = '#dashboard_test .dashboard-renderer-container'
        const dashboardCss = "@import url('https://fonts.example/dashboard.css');\n.container, a { color: white; }\nbody { margin: 0; }\n:root { --widget-color: red; }"

        const result = scopeDashboardCssToContainer(dashboardCss, scopeSelector)
        const normalizedResult = normalizeCss(result)

        expect(normalizedResult).not.toContain(normalizeCss("@import url('https://fonts.example/dashboard.css');"))
        expect(normalizedResult).toContain(normalizeCss(`${scopeSelector} .container, ${scopeSelector} a { color: white; }`))
        expect(normalizedResult).toContain(normalizeCss(`${scopeSelector} { margin: 0; }`))
        expect(normalizedResult).toContain(normalizeCss(`${scopeSelector} { --widget-color: red; }`))
    })

    it('scopes nested media rules and leaves structural at-rules untouched', () => {
        const scopeSelector = '#dashboard_test .dashboard-renderer-container'
        const dashboardCss =
            "@font-face { font-family: 'Demo'; src: url('demo.woff2'); }\n@keyframes fade { from { opacity: 0; } to { opacity: 1; } }\n@media screen and (max-width: 600px) { .module { display: flex; } body { padding: 0; } }"

        const result = scopeDashboardCssToContainer(dashboardCss, scopeSelector)
        const normalizedResult = normalizeCss(result)

        expect(normalizedResult).toContain(normalizeCss("@font-face { font-family: 'Demo'; src: url('demo.woff2'); }"))
        expect(normalizedResult).toContain(normalizeCss('@keyframes fade { from { opacity: 0; } to { opacity: 1; } }'))
        expect(normalizedResult).toContain(normalizeCss(`@media screen and (max-width: 600px) { ${scopeSelector} .module { display: flex; } ${scopeSelector} { padding: 0; } }`))
    })
})
