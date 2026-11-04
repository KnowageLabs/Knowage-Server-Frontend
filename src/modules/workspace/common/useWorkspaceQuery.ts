import { computed } from 'vue'
import { LocationQuery, useRoute, useRouter } from 'vue-router'

// The toolbar state lives in the URL query (spec 5.3). It is written with router.replace, so a reload
// or a shared link shows the same list and Back does not step through every filter click.
// Unknown values are ignored.
export type WsQueryField = { param: string; kind: 'enum'; values: readonly string[]; default: string } | { param: string; kind: 'list'; values?: readonly string[]; lowercase?: boolean } | { param: string; kind: 'string' }

type FieldValue<F> = F extends { kind: 'enum' } ? string : F extends { kind: 'list' } ? string[] : F extends { kind: 'string' } ? string : never
export type WsQueryState<S extends Record<string, WsQueryField>> = { [K in keyof S]: FieldValue<S[K]> }

const first = (value: LocationQuery[string]): string => (Array.isArray(value) ? (value[0] ?? '') : (value ?? '')) as string

export function parseWorkspaceQuery<S extends Record<string, WsQueryField>>(schema: S, query: LocationQuery): WsQueryState<S> {
    const state: any = {}
    for (const [key, field] of Object.entries(schema)) {
        const raw = first(query[field.param]).trim()
        if (field.kind === 'enum') state[key] = field.values.includes(raw) ? raw : field.default
        else if (field.kind === 'string') state[key] = raw
        else {
            const items = raw
                ? raw
                      .split(',')
                      .map((v) => v.trim())
                      .filter(Boolean)
                : []
            const allowed = field.values
            state[key] = allowed ? items.map((v) => allowed.find((a) => a.toLowerCase() === v.toLowerCase())).filter((v): v is string => !!v) : items
            state[key] = [...new Set(state[key])]
        }
    }
    return state
}

export function serializeWorkspaceQuery<S extends Record<string, WsQueryField>>(schema: S, state: WsQueryState<S>): Record<string, string> {
    const query: Record<string, string> = {}
    for (const [key, field] of Object.entries(schema)) {
        const value: any = (state as any)[key]
        if (field.kind === 'enum') {
            if (value && value !== field.default) query[field.param] = value
        } else if (field.kind === 'string') {
            if (value) query[field.param] = value
        } else if (value?.length) query[field.param] = value.map((v: string) => (field.lowercase ? v.toLowerCase() : v)).join(',')
    }
    return query
}

export function useWorkspaceQuery<S extends Record<string, WsQueryField>>(schema: S) {
    const route = useRoute()
    const router = useRouter()
    const routeName = route.name

    // Tabs stay alive (keep-alive in Workspace.vue): a hidden tab keeps its last state instead of
    // reading the query of the tab that is shown.
    let last = parseWorkspaceQuery(schema, route.query)
    const state = computed(() => {
        if (route.name === routeName) last = parseWorkspaceQuery(schema, route.query)
        return last
    })

    function update(patch: Partial<WsQueryState<S>>) {
        if (route.name !== routeName) return
        const next = { ...state.value, ...patch } as WsQueryState<S>
        router.replace({ query: serializeWorkspaceQuery(schema, next) })
    }

    function toggleInList(key: keyof S, value: string) {
        const current = (state.value[key] as unknown as string[]) ?? []
        const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
        update({ [key]: next } as any)
    }

    return { state, update, toggleInList }
}
