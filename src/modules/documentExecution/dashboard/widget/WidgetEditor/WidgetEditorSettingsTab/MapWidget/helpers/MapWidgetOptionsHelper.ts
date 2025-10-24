export const normalizeSelectOptions = (opts: any[] | undefined | null): any[] => {
    if (!opts) return []
    return opts.map((o: any) => {
        if (o === null || o === undefined) return { name: '' }
        if (typeof o === 'string') return { name: o }
        const name = o.name ?? o.property ?? o.alias ?? String(o)
        return { ...o, name }
    })
}

export default normalizeSelectOptions
