import { describe, expect, it } from 'vitest'
import {
    appendNode,
    buildChangeList,
    configToNodes,
    configToSite,
    fileLetter,
    filterZipEntries,
    folderForChildren,
    isConfigChanged,
    isValidFileName,
    MAX_ZIP_BYTES,
    missingFolders,
    moveNode,
    nodeLetter,
    nodesToConfig,
    slugify,
    subtreeIds,
    uniqueFileName
} from '../documentationManagementHelpers'
import type { iDocsNode, iDocsState } from '../DocumentationManagement'

const sampleConfig = () => ({
    title: 'Sample',
    logo: true,
    dense: false,
    menu: true,
    'x-top': 'keep me',
    content: [
        {
            label: 'Getting started',
            header: true,
            content: [{ label: 'Welcome', path: '/index.md' }]
        },
        {
            label: 'Sales',
            path: '/sales/index.md',
            roles: ['sales_user', 'admin'],
            'x-note': 'keep me',
            content: [
                { label: 'Dashboard', path: '/sales/dashboard.md' },
                { label: 'Regions', content: [{ label: 'EMEA', path: '/sales/regions/emea.md', roles: ['admin'] }] }
            ]
        }
    ]
})

function makeState(config: any = sampleConfig(), files: Record<string, string> = {}): iDocsState {
    const baseNodes = configToNodes(config)
    const baseFiles: iDocsState['baseFiles'] = {}
    const list = ['index.md', 'sales/index.md', 'sales/dashboard.md', 'sales/regions/emea.md', 'orphan.md']
    list.forEach((path) => (baseFiles[path] = { lastModified: 1, content: files[path] ?? `# ${path}` }))
    return {
        baseConfig: config,
        baseSite: configToSite(config),
        baseNodes,
        baseFiles,
        site: configToSite(config),
        nodes: baseNodes.map((node) => ({ ...node, extra: { ...node.extra }, roles: [...node.roles] })),
        contents: {},
        deletedPaths: []
    }
}

const byLabel = (state: iDocsState, label: string) => state.nodes.find((node) => node.label === label) as iDocsNode

describe('config round trip', () => {
    it('writes back the same config, unknown keys included', () => {
        const config = sampleConfig()
        expect(nodesToConfig(config, configToSite(config), configToNodes(config))).toEqual(config)
    })

    it('normalizes paths with and without a leading slash, missing roles and content', () => {
        const nodes = configToNodes({ content: [{ label: 'A', path: 'a.md' }, { label: 'B', path: '/b.md', roles: [], content: [] }] })
        expect(nodes.map((node) => node.file)).toEqual(['a.md', 'b.md'])
        expect(nodes[1].roles).toEqual([])
    })

    it('finds no change right after the load', () => {
        const config = { content: [{ label: 'A', path: 'a.md', roles: [], content: [] }] }
        expect(isConfigChanged(config, configToSite(config), configToNodes(config))).toBe(false)
        expect(isConfigChanged(sampleConfig(), configToSite(sampleConfig()), configToNodes(sampleConfig()))).toBe(false)
    })

    it('finds a change in a label, in the site and in the order', () => {
        const config = sampleConfig()
        const nodes = configToNodes(config)
        nodes[0].label = 'Start'
        expect(isConfigChanged(config, configToSite(config), nodes)).toBe(true)
        expect(isConfigChanged(config, { ...configToSite(config), dense: true }, configToNodes(config))).toBe(true)
        const fresh = configToNodes(config)
        const reordered = moveNode(fresh, fresh[0].id, null, 'end') as iDocsNode[]
        expect(isConfigChanged(config, configToSite(config), reordered)).toBe(true)
    })

    it('omits a deleted node and its subtree', () => {
        const state = makeState()
        const sales = byLabel(state, 'Sales')
        subtreeIds(state.nodes, sales.id).forEach((id) => (state.nodes.find((node) => node.id === id)!.deleted = true))
        expect(nodesToConfig(state.baseConfig, state.site, state.nodes).content).toHaveLength(1)
    })
})

describe('letters (spec 7.5)', () => {
    it('has no letter right after the load', () => {
        const state = makeState()
        state.nodes.forEach((node) => expect(nodeLetter(state, node)).toBe(''))
    })

    it('U for a new node and for a new page on an existing node', () => {
        const state = makeState()
        const regions = byLabel(state, 'Regions')
        regions.file = 'sales/regions/index.md'
        state.contents['sales/regions/index.md'] = '# Regions'
        expect(nodeLetter(state, regions)).toBe('U')
        state.nodes = appendNode(state.nodes, { id: 'new', parentId: null, label: 'New', file: '', roles: [], extra: {} }, null)
        expect(nodeLetter(state, state.nodes.find((node) => node.id === 'new')!)).toBe('U')
    })

    it('M for content, label, roles and position', () => {
        let state = makeState()
        state.contents['sales/dashboard.md'] = 'changed'
        expect(nodeLetter(state, byLabel(state, 'Dashboard'))).toBe('M')

        state = makeState()
        byLabel(state, 'Dashboard').label = 'Board'
        expect(nodeLetter(state, byLabel(state, 'Board'))).toBe('M')

        state = makeState()
        byLabel(state, 'Dashboard').roles = ['admin']
        expect(nodeLetter(state, byLabel(state, 'Dashboard'))).toBe('M')

        state = makeState()
        const moved = moveNode(state.nodes, byLabel(state, 'Dashboard').id, byLabel(state, 'Getting started').id, 'inside') as iDocsNode[]
        state.nodes = moved
        expect(nodeLetter(state, byLabel(state, 'Dashboard'))).toBe('M')
    })

    it('R for a new file name of a saved page', () => {
        const state = makeState()
        const node = byLabel(state, 'Dashboard')
        node.file = 'sales/board.md'
        state.contents['sales/board.md'] = '# sales/dashboard.md'
        expect(nodeLetter(state, node)).toBe('R')
    })

    it('D for a deleted saved node', () => {
        const state = makeState()
        byLabel(state, 'Dashboard').deleted = true
        expect(nodeLetter(state, byLabel(state, 'Dashboard'))).toBe('D')
    })

    it('two nodes on one file show the same letter and write one row (D15)', () => {
        const state = makeState()
        const welcome = byLabel(state, 'Welcome')
        state.contents['index.md'] = 'home changed'
        expect(nodeLetter(state, welcome)).toBe('M')
        expect(fileLetter(state, 'index.md')).toBe('M')
        expect(buildChangeList(state).filter((row) => row.path === 'index.md')).toHaveLength(1)
    })

    it('an opened file is not a change', () => {
        const state = makeState()
        state.contents['sales/dashboard.md'] = state.baseFiles['sales/dashboard.md'].content as string
        expect(buildChangeList(state)).toEqual([])
    })
})

describe('buildChangeList', () => {
    it('lists pages, then config.json, then deletes', () => {
        const state = makeState()
        byLabel(state, 'Regions').deleted = true
        byLabel(state, 'EMEA').deleted = true
        state.contents['sales/dashboard.md'] = 'changed'
        state.deletedPaths = ['orphan.md']
        const rows = buildChangeList(state)
        expect(rows.map((row) => row.kind)).toEqual(['page', 'config', 'delete', 'delete'])
        expect(rows.map((row) => row.path)).toEqual(['sales/dashboard.md', 'config.json', 'sales/regions/emea.md', 'orphan.md'])
    })

    it('gives one R row for a rename, and deletes the old name after the new one', () => {
        const state = makeState()
        const node = byLabel(state, 'Dashboard')
        node.file = 'sales/board.md'
        state.contents['sales/board.md'] = 'content'
        const rows = buildChangeList(state)
        const renamed = rows.filter((row) => row.letter === 'R')
        expect(renamed).toHaveLength(1)
        expect(renamed[0]).toMatchObject({ path: 'sales/board.md', oldPath: 'sales/dashboard.md', deleteOld: true })
        expect(rows.map((row) => row.kind)).toEqual(['page', 'config'])
    })

    it('keeps the old file when another node still uses it', () => {
        const state = makeState()
        const welcome = byLabel(state, 'Welcome')
        welcome.file = 'welcome.md'
        state.contents['welcome.md'] = 'hello'
        const row = buildChangeList(state).find((r) => r.letter === 'R')
        expect(row?.deleteOld).toBe(false)
    })

    it('does not delete a file that a live node still uses, or index.md', () => {
        const state = makeState()
        byLabel(state, 'Welcome').deleted = true
        expect(buildChangeList(state).filter((row) => row.kind === 'delete')).toEqual([])
    })

    it('writes the config of a site that has none', () => {
        const state = makeState()
        state.baseConfig = null
        expect(buildChangeList(state).find((row) => row.kind === 'config')?.letter).toBe('U')
    })
})

describe('moveNode', () => {
    const flat = () => configToNodes(sampleConfig())
    const order = (nodes: iDocsNode[]) => nodes.map((node) => node.label)

    it('moves before and after a row', () => {
        const nodes = flat()
        const sales = nodes.find((n) => n.label === 'Sales')!
        const start = nodes.find((n) => n.label === 'Getting started')!
        expect(order(moveNode(nodes, sales.id, start.id, 'before') as iDocsNode[]).slice(0, 2)).toEqual(['Sales', 'Dashboard'])
        const after = moveNode(nodes, start.id, sales.id, 'after') as iDocsNode[]
        expect(order(after)).toEqual(['Sales', 'Dashboard', 'Regions', 'EMEA', 'Getting started', 'Welcome'])
        expect(after.find((n) => n.label === 'Getting started')!.parentId).toBeNull()
    })

    it('moves inside as the last child, and to the end of the top level', () => {
        const nodes = flat()
        const start = nodes.find((n) => n.label === 'Getting started')!
        const sales = nodes.find((n) => n.label === 'Sales')!
        const inside = moveNode(nodes, start.id, sales.id, 'inside') as iDocsNode[]
        expect(order(inside)).toEqual(['Sales', 'Dashboard', 'Regions', 'EMEA', 'Getting started', 'Welcome'])
        expect(inside.find((n) => n.label === 'Getting started')!.parentId).toBe(sales.id)
        const emea = nodes.find((n) => n.label === 'EMEA')!
        const end = moveNode(nodes, emea.id, null, 'end') as iDocsNode[]
        expect(order(end).at(-1)).toBe('EMEA')
        expect(end.at(-1)!.parentId).toBeNull()
    })

    it('refuses a drop into the own subtree', () => {
        const nodes = flat()
        const sales = nodes.find((n) => n.label === 'Sales')!
        const emea = nodes.find((n) => n.label === 'EMEA')!
        expect(moveNode(nodes, sales.id, emea.id, 'inside')).toBeNull()
        expect(moveNode(nodes, sales.id, sales.id, 'before')).toBeNull()
    })
})

describe('filterZipEntries', () => {
    const entry = (path: string, size = 10) => ({ path, size })

    it('sorts the entries and skips the unsafe ones', () => {
        const result = filterZipEntries([entry('config.json'), entry('index.md'), entry('sales/a.md'), entry('images/x.png'), entry('../x.md'), entry('/abs.md'), entry('C:/x.md'), entry('tool.exe'), entry('bad name é.md'), entry('folder/')])
        expect(result.config?.path).toBe('config.json')
        expect(result.pages.map((e) => e.path)).toEqual(['index.md', 'sales/a.md'])
        expect(result.images.map((e) => e.path)).toEqual(['images/x.png'])
        expect(Object.fromEntries(result.skipped.map((s) => [s.path, s.reason]))).toEqual({
            '../x.md': 'unsafePath',
            '/abs.md': 'unsafePath',
            'C:/x.md': 'unsafePath',
            'tool.exe': 'unsupported',
            'bad name é.md': 'badName'
        })
    })

    it('stops at 500 entries', () => {
        const entries = Array.from({ length: 503 }, (_, i) => entry(`p${i}.md`))
        const result = filterZipEntries(entries)
        expect(result.pages).toHaveLength(500)
        expect(result.skipped.map((s) => s.reason)).toEqual(['tooManyEntries', 'tooManyEntries', 'tooManyEntries'])
    })

    it('stops at 50 MB', () => {
        const result = filterZipEntries([entry('a.md', MAX_ZIP_BYTES - 5), entry('b.md', 10), entry('c.md', 1)])
        expect(result.pages.map((e) => e.path)).toEqual(['a.md'])
        expect(result.skipped.map((s) => s.reason)).toEqual(['tooLarge', 'tooLarge'])
    })
})

describe('names', () => {
    it('slugify', () => {
        expect(slugify('Getting Started!')).toBe('getting-started')
        expect(slugify('Città è bella')).toBe('citta-e-bella')
        expect(slugify('???')).toBe('page')
    })

    it('isValidFileName follows the server rule', () => {
        expect(isValidFileName('sales/my page (1).md')).toBe(true)
        expect(isValidFileName('a/b-c_d.md')).toBe(true)
        expect(isValidFileName('città.md')).toBe(false)
        expect(isValidFileName('a/../b.md')).toBe(false)
        expect(isValidFileName('/a.md')).toBe(false)
        expect(isValidFileName('a//b.md')).toBe(false)
        expect(isValidFileName('a:b.md')).toBe(false)
    })

    it('uniqueFileName adds -1, -2', () => {
        expect(uniqueFileName('sales', 'page', [])).toBe('sales/page.md')
        expect(uniqueFileName('sales', 'page', ['sales/page.md'])).toBe('sales/page-1.md')
        expect(uniqueFileName('', 'page', ['page.md', 'Page-1.md'])).toBe('page-2.md')
    })

    it('missingFolders returns the parents first', () => {
        expect(missingFolders(['a/b/c.md', 'a/d.md', 'x.md', 'e/f/g.md'], ['e'])).toEqual(['a', 'a/b', 'e/f'])
        expect(missingFolders(['a/b/c.md'], [])).toEqual(['a', 'a/b'])
        expect(missingFolders(['a/b/c.md'], ['a'])).toEqual(['a/b'])
    })

    it('folderForChildren uses the folder of the page, else the slugs', () => {
        const nodes = configToNodes(sampleConfig())
        const sales = nodes.find((n) => n.label === 'Sales')!
        const regions = nodes.find((n) => n.label === 'Regions')!
        const start = nodes.find((n) => n.label === 'Getting started')!
        expect(folderForChildren(nodes, null)).toBe('')
        expect(folderForChildren(nodes, sales.id)).toBe('sales')
        expect(folderForChildren(nodes, regions.id)).toBe('sales/regions')
        expect(folderForChildren(nodes, start.id)).toBe('getting-started')
    })
})
