import type { DocsWorkingCopy } from './useDocsWorkingCopy'
import { HOME_FILE } from './documentationManagementHelpers'

// Dev only: /documentation-management?mock=<name> shows the manager in a given state. The import is behind import.meta.env.DEV, so production builds drop it.
// "states" uses the real working-copy actions on top of the loaded site, so the letters, dots and banners are the real ones.
// It is a normal working copy: Discard all removes it, and Save would write it to the server.
export type iDocsDevMock = 'states' | 'noSite' | 'brokenConfig' | 'error'

const VERSION_PAGE = `# Version 9.1

| Area | Change |
|---|---|
| Dashboards | Sheet backgrounds from the theme |
| Scheduler | New job editor |

\`\`\`mermaid
graph LR; Draft-->Review-->Published
\`\`\`
`

// Returns the node to select, if any.
export async function applyDocsDevMock(wc: DocsWorkingCopy, mock: string): Promise<string | null> {
    if (mock === 'noSite') {
        wc.status.value = 'noSite'
        return null
    }
    if (mock === 'error') {
        wc.status.value = 'error'
        return null
    }
    if (mock === 'brokenConfig') {
        wc.rawConfig.value = '{\n  "title": "Sample Project Docs",\n  "content": [\n    { "label": "Getting started", }\n  ]\n}\n'
        wc.configError.value = 'Unexpected token } in JSON at position 72'
        wc.status.value = 'brokenConfig'
        return null
    }
    if (mock !== 'states' || wc.status.value !== 'ready') return null

    // M on the start page: the site block and every node on index.md show it.
    if (wc.baseFiles.value[HOME_FILE]) {
        const home = await wc.ensureContent(HOME_FILE)
        wc.setContent(HOME_FILE, home + '\nA line added by the dev mock.\n')
    }

    // R and D on saved pages (the first saved page is renamed, the last one is deleted).
    const savedPages = wc.baseNodes.value.filter((node) => node.file && node.file !== HOME_FILE).map((node) => wc.nodeById(node.id)!)
    const renamed = savedPages[0]
    if (renamed) await wc.setNodeFile(renamed.id, renamed.file.replace(/\.md$/, '-renamed.md'))
    const deleted = savedPages.length > 1 ? savedPages[savedPages.length - 1] : null
    if (deleted) wc.deleteNode(deleted.id)

    // U: a new section without a page (empty state), roles on the section, a child that lists a role the section hides (error state), deep nesting.
    // addNode returns the plain object; the roles go on the node in the reactive list.
    const section = wc.addNode(null, 'Release notes', false)
    wc.nodeById(section.id)!.roles = ['admin']
    const version = wc.addNode(section.id, 'Version 9.1', true, VERSION_PAGE)
    wc.nodeById(version.id)!.roles = ['admin', 'user']
    let parent = version.id
    for (const label of ['Dashboards', 'Widgets', 'Tables', 'Column settings', 'Conditional colors']) parent = wc.addNode(parent, label, true).id

    // A new file that no node uses: "Not in menu" with U.
    wc.setContent('drafts/roadmap.md', '# Roadmap\n\nNot in the menu yet.\n')

    return version.id
}
