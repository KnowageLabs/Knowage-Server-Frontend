const CONTAINER_AT_RULES = new Set(['container', 'document', 'layer', 'media', 'scope', 'starting-style', 'supports'])

const ROOT_CHAIN_ONLY_REGEX = /^(?:(?:html|body|:root)\s+)+(?:html|body|:root)\b/i
const ROOT_CHAIN_WITH_DESCENDANTS_REGEX = /^(?:(?:html|body|:root)\s+)+/i
const ROOT_COMPOUND_PREFIX_REGEX = /^(?:html|body|:root)(?=[.#[:])/i
const ROOT_SELECTOR_REGEX = /^(?:html|body|:root)\b/i

const advancePastComment = (css: string, startIndex: number): number => {
    const commentEndIndex = css.indexOf('*/', startIndex + 2)
    return commentEndIndex === -1 ? css.length : commentEndIndex + 2
}

const advancePastString = (css: string, startIndex: number): number => {
    const quote = css[startIndex]
    let index = startIndex + 1

    while (index < css.length) {
        if (css[index] === '\\') {
            index += 2
            continue
        }

        if (css[index] === quote) return index + 1
        index++
    }

    return index
}

const findMatchingBrace = (css: string, openBraceIndex: number): number => {
    let depth = 1
    let index = openBraceIndex + 1
    let parenDepth = 0
    let bracketDepth = 0

    while (index < css.length) {
        const currentChar = css[index]

        if (currentChar === '"' || currentChar === "'") {
            index = advancePastString(css, index)
            continue
        }

        if (currentChar === '/' && css[index + 1] === '*') {
            index = advancePastComment(css, index)
            continue
        }

        if (currentChar === '(') parenDepth++
        else if (currentChar === ')' && parenDepth > 0) parenDepth--
        else if (currentChar === '[') bracketDepth++
        else if (currentChar === ']' && bracketDepth > 0) bracketDepth--

        if (parenDepth === 0 && bracketDepth === 0) {
            if (currentChar === '{') depth++
            if (currentChar === '}') depth--
        }

        if (depth === 0) return index
        index++
    }

    return css.length - 1
}

const findTopLevelDelimiter = (css: string, startIndex: number, delimiters: string[]): number => {
    let index = startIndex
    let parenDepth = 0
    let bracketDepth = 0

    while (index < css.length) {
        const currentChar = css[index]

        if (currentChar === '"' || currentChar === "'") {
            index = advancePastString(css, index)
            continue
        }

        if (currentChar === '/' && css[index + 1] === '*') {
            index = advancePastComment(css, index)
            continue
        }

        if (currentChar === '(') parenDepth++
        else if (currentChar === ')' && parenDepth > 0) parenDepth--
        else if (currentChar === '[') bracketDepth++
        else if (currentChar === ']' && bracketDepth > 0) bracketDepth--
        else if (parenDepth === 0 && bracketDepth === 0 && delimiters.includes(currentChar)) return index

        index++
    }

    return -1
}

const collectLeadingTrivia = (css: string, startIndex: number): { trivia: string; nextIndex: number } => {
    let index = startIndex

    while (index < css.length) {
        if (/\s/.test(css[index])) {
            index++
            continue
        }

        if (css[index] === '/' && css[index + 1] === '*') {
            index = advancePastComment(css, index)
            continue
        }

        break
    }

    return { trivia: css.slice(startIndex, index), nextIndex: index }
}

const splitSelectorList = (selectorText: string): string[] => {
    const selectors: string[] = []
    let cursor = 0
    let index = 0
    let parenDepth = 0
    let bracketDepth = 0

    while (index < selectorText.length) {
        const currentChar = selectorText[index]

        if (currentChar === '"' || currentChar === "'") {
            index = advancePastString(selectorText, index)
            continue
        }

        if (currentChar === '/' && selectorText[index + 1] === '*') {
            index = advancePastComment(selectorText, index)
            continue
        }

        if (currentChar === '(') parenDepth++
        else if (currentChar === ')' && parenDepth > 0) parenDepth--
        else if (currentChar === '[') bracketDepth++
        else if (currentChar === ']' && bracketDepth > 0) bracketDepth--
        else if (currentChar === ',' && parenDepth === 0 && bracketDepth === 0) {
            selectors.push(selectorText.slice(cursor, index))
            cursor = index + 1
        }

        index++
    }

    selectors.push(selectorText.slice(cursor))
    return selectors
}

const scopeRootSelector = (selector: string, scopeSelector: string): string => {
    const rootChainOnlyScopedSelector = selector.replace(ROOT_CHAIN_ONLY_REGEX, scopeSelector)
    if (rootChainOnlyScopedSelector !== selector) return rootChainOnlyScopedSelector.trim()

    const rootChainWithDescendantsScopedSelector = selector.replace(ROOT_CHAIN_WITH_DESCENDANTS_REGEX, `${scopeSelector} `)
    if (rootChainWithDescendantsScopedSelector !== selector) return rootChainWithDescendantsScopedSelector.trim()

    const rootCompoundScopedSelector = selector.replace(ROOT_COMPOUND_PREFIX_REGEX, scopeSelector)
    if (rootCompoundScopedSelector !== selector) return rootCompoundScopedSelector.trim()

    const rootScopedSelector = selector.replace(ROOT_SELECTOR_REGEX, scopeSelector)
    if (rootScopedSelector !== selector) return rootScopedSelector.trim()

    return ''
}

const scopeSelector = (selector: string, scopeSelectorValue: string): string => {
    const trimmedSelector = selector.trim()
    if (!trimmedSelector) return ''

    if (trimmedSelector.startsWith(scopeSelectorValue)) return trimmedSelector

    const rootScopedSelector = scopeRootSelector(trimmedSelector, scopeSelectorValue)
    if (rootScopedSelector) return rootScopedSelector

    return `${scopeSelectorValue} ${trimmedSelector}`
}

const scopeSelectors = (selectorText: string, scopeSelectorValue: string): string => {
    return splitSelectorList(selectorText)
        .map((selector) => scopeSelector(selector, scopeSelectorValue))
        .filter(Boolean)
        .join(', ')
}

const extractCssImports = (css: string): { imports: string[]; body: string } => {
    const imports: string[] = []
    let body = ''
    let cursor = 0
    let index = 0

    while (index < css.length) {
        if (css[index] === '"' || css[index] === "'") {
            index = advancePastString(css, index)
            continue
        }

        if (css[index] === '/' && css[index + 1] === '*') {
            index = advancePastComment(css, index)
            continue
        }

        if (css[index] === '{') {
            index = findMatchingBrace(css, index) + 1
            continue
        }

        if (css.slice(index, index + 7).toLowerCase() === '@import') {
            const importEndIndex = findTopLevelDelimiter(css, index, [';'])
            if (importEndIndex === -1) break

            body += css.slice(cursor, index)
            imports.push(css.slice(index, importEndIndex + 1).trim())
            cursor = importEndIndex + 1
            index = cursor
            continue
        }

        index++
    }

    body += css.slice(cursor)
    return { imports, body: body.trim() }
}

const scopeCssBody = (css: string, scopeSelectorValue: string): string => {
    let result = ''
    let index = 0

    while (index < css.length) {
        const { trivia, nextIndex } = collectLeadingTrivia(css, index)
        result += trivia
        index = nextIndex

        if (index >= css.length) break

        const delimiterIndex = findTopLevelDelimiter(css, index, ['{', ';'])
        if (delimiterIndex === -1) {
            result += css.slice(index)
            break
        }

        const delimiter = css[delimiterIndex]
        if (delimiter === ';') {
            result += css.slice(index, delimiterIndex + 1)
            index = delimiterIndex + 1
            continue
        }

        const prelude = css.slice(index, delimiterIndex)
        const closeBraceIndex = findMatchingBrace(css, delimiterIndex)
        const blockContent = css.slice(delimiterIndex + 1, closeBraceIndex)
        const trimmedPrelude = prelude.trim()

        if (!trimmedPrelude) {
            result += css.slice(index, closeBraceIndex + 1)
            index = closeBraceIndex + 1
            continue
        }

        if (trimmedPrelude.startsWith('@')) {
            const atRuleName = trimmedPrelude.slice(1).split(/[\s{]/)[0].toLowerCase()
            if (CONTAINER_AT_RULES.has(atRuleName)) result += `${prelude}{${scopeCssBody(blockContent, scopeSelectorValue)}}`
            else result += `${prelude}{${blockContent}}`
        } else {
            const scopedPrelude = scopeSelectors(prelude, scopeSelectorValue)
            result += `${scopedPrelude || trimmedPrelude}{${blockContent}}`
        }

        index = closeBraceIndex + 1
    }

    return result.trim()
}

const joinCssBlocks = (blocks: string[]): string => blocks.map((block) => block.trim()).filter(Boolean).join('\n')

export const composeCssWithHoistedImports = (...cssBlocks: string[]): string => {
    const imports: string[] = []
    const bodies: string[] = []

    cssBlocks.forEach((cssBlock) => {
        const { imports: blockImports, body } = extractCssImports(cssBlock ?? '')
        imports.push(...blockImports)
        if (body) bodies.push(body)
    })

    return joinCssBlocks([...imports, ...bodies])
}

export const scopeDashboardCssToContainer = (dashboardCss: string, scopeSelectorValue: string): string => {
    if (!dashboardCss?.trim() || !scopeSelectorValue?.trim()) return dashboardCss?.trim() ?? ''

    // Imported stylesheets stay global even when the host <style> is scoped by selector rewriting,
    // so keep @import rules out of light-DOM dashboard/editor containers.
    const { body } = extractCssImports(dashboardCss)
    return scopeCssBody(body, scopeSelectorValue.trim())
}
