import { webcrypto, createHash } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { beginSamlLogin, exchangeSamlCode, isFederatedSession } from './samlAuth'
import { isAuthCallbackInProgress, isSamlCallbackInProgress } from './authState'

describe('SAML browser correlation', () => {
    beforeEach(() => {
        sessionStorage.clear()
        window.history.replaceState({}, '', '/login')
    })

    it('sends only the SHA-256 challenge and exchanges the code once with the original verifier', async () => {
        const target = new URL(await beginSamlLogin('/knowage/restful-services/saml/login', sessionStorage, webcrypto as unknown as Crypto))
        const verifier = sessionStorage.getItem('knowage.saml.verifier')!
        expect(verifier).toMatch(/^[A-Za-z0-9_-]{43}$/)
        expect(target.searchParams.get('challenge')).toBe(createHash('sha256').update(verifier).digest('base64url'))
        expect(target.toString()).not.toContain(verifier)

        const send = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ token: 'application-token' }) })
        await expect(exchangeSamlCode('c'.repeat(43), '/exchange', sessionStorage, send)).resolves.toBe('application-token')
        expect(JSON.parse(send.mock.calls[0][1].body)).toEqual({ code: 'c'.repeat(43), verifier })
        await expect(exchangeSamlCode('c'.repeat(43), '/exchange', sessionStorage, send)).rejects.toThrow()
        expect(send).toHaveBeenCalledOnce()
    })

    it('rejects cross-origin login destinations before saving an attempt', async () => {
        await expect(beginSamlLogin('https://other.example/login')).rejects.toThrow()
        expect(sessionStorage.getItem('knowage.saml.verifier')).toBeNull()
    })

    it('rejects a callback from another browser without sending a request', async () => {
        const send = vi.fn()
        await expect(exchangeSamlCode('c'.repeat(43), '/exchange', sessionStorage, send)).rejects.toThrow()
        expect(send).not.toHaveBeenCalled()
    })

    it('does not send the verifier to a cross-origin exchange endpoint', async () => {
        sessionStorage.setItem('knowage.saml.verifier', 'v'.repeat(43))
        const send = vi.fn()
        await expect(exchangeSamlCode('c'.repeat(43), 'https://other.example/exchange', sessionStorage, send)).rejects.toThrow()
        expect(send).not.toHaveBeenCalled()
    })

    it('recognizes a restored federated token without mistaking legacy credentials for federation', () => {
        sessionStorage.setItem('token', `header.${btoa(JSON.stringify({ kn_saml_sid: 'session-id' }))}.signature`)
        expect(isFederatedSession()).toBe(true)
        sessionStorage.setItem('token', `header.${btoa(JSON.stringify({ sub: 'legacy-user' }))}.signature`)
        expect(isFederatedSession()).toBe(false)
        sessionStorage.setItem('token', 'legacy-ticket')
        expect(isFederatedSession()).toBe(false)
    })

    it.each([{ ok: false }, { ok: true, json: async () => ({}) }])('consumes the attempt even when exchange fails: %j', async (response) => {
        sessionStorage.setItem('knowage.saml.verifier', 'v'.repeat(43))
        await expect(exchangeSamlCode('c'.repeat(43), '/exchange', sessionStorage, vi.fn().mockResolvedValue(response))).rejects.toThrow()
        expect(sessionStorage.getItem('knowage.saml.verifier')).toBeNull()
    })

    it.each(['samlCode=c', 'samlError=authentication_failed', 'samlLoggedOut=true'])('recognizes callbacks on both login entrypoints: %s', (fragment) => {
        for (const path of ['/knowage-vue/login', '/knowage-vue/saml-login']) {
            window.history.replaceState({}, '', `${path}#${fragment}`)
            expect(isSamlCallbackInProgress()).toBe(true)
            expect(isAuthCallbackInProgress()).toBe(true)
        }
        window.history.replaceState({}, '', `/workspace#${fragment}`)
        expect(isSamlCallbackInProgress()).toBe(false)
    })
})
