const attemptKey = 'knowage.saml.verifier'

export function isFederatedSession(storage = sessionStorage): boolean {
    if (storage.getItem('knowage.saml') === 'true') return true
    // Classify restored sessions for logout routing only; the backend verifies the JWT.
    try {
        const payload = (storage.getItem('token') ?? '').split('.')[1].replaceAll('-', '+').replaceAll('_', '/')
        const sid = JSON.parse(atob(payload)).kn_saml_sid
        return typeof sid === 'string' && sid.length > 0
    } catch {
        return false
    }
}

function base64url(bytes: ArrayBuffer | Uint8Array): string {
    return btoa(String.fromCharCode(...new Uint8Array(bytes)))
        .replaceAll('+', '-')
        .replaceAll('/', '_')
        .replaceAll('=', '')
}

export async function beginSamlLogin(loginUrl: string, storage = sessionStorage, cryptography = crypto): Promise<string> {
    const target = new URL(loginUrl, window.location.origin)
    if (target.origin !== window.location.origin) throw new Error('Invalid SAML login URL')
    const verifier = base64url(cryptography.getRandomValues(new Uint8Array(32)))
    const challenge = base64url(await cryptography.subtle.digest('SHA-256', new TextEncoder().encode(verifier)))
    storage.setItem(attemptKey, verifier)
    target.searchParams.set('challenge', challenge)
    return target.toString()
}

export async function exchangeSamlCode(code: string | null, endpoint: string, storage = sessionStorage, send = fetch): Promise<string> {
    const verifier = storage.getItem(attemptKey)
    storage.removeItem(attemptKey)
    if (!/^[A-Za-z0-9_-]{43}$/.test(code ?? '') || !/^[A-Za-z0-9_-]{43}$/.test(verifier ?? '')) throw new Error('Invalid SAML attempt')
    if (new URL(endpoint, window.location.origin).origin !== window.location.origin) throw new Error('Invalid SAML exchange URL')
    const result = await send(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, verifier })
    })
    if (!result.ok) throw new Error('SAML login rejected')
    const response = await result.json()
    if (typeof response.token !== 'string' || !response.token) throw new Error('Missing application token')
    return response.token
}
