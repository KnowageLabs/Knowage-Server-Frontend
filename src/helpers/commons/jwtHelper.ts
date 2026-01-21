import { decode } from 'js-base64'

export interface JWTUser {
    userId?: string
    userName?: string
    userUniqueIdentifier?: string
    organization?: string
    locale?: string
    email?: string
    fullName?: string
    defaultRole?: string
    sessionRole?: string
    roles?: string[]
    functionalities?: string[]
    isSuperadmin?: boolean
    enterprise?: boolean
    enterpriseValid?: boolean
    [key: string]: any
}

/**
 * Decodifica un token JWT e ne estrae il payload
 * @param token - Il token JWT da decodificare
 * @returns L'oggetto con i dati dell'utente o null se il token non è valido
 */
export function decodeJWT(token: string): JWTUser | null {
    try {
        if (!token || typeof token !== 'string') {
            return null
        }

        // Un JWT è composto da 3 parti separate da punti: header.payload.signature
        const parts = token.split('.')
        if (parts.length !== 3) {
            console.error('Token JWT non valido: formato errato')
            return null
        }

        // La seconda parte è il payload codificato in base64
        const payload = parts[1]

        // Decodifica il payload usando js-base64
        const decodedPayload = decode(payload)

        // Parse del JSON
        const userData = JSON.parse(decodedPayload)

        return userData
    } catch (error) {
        console.error('Errore nella decodifica del token JWT:', error)
        return null
    }
}

/**
 * Verifica se un token JWT è scaduto
 * @param token - Il token JWT da verificare
 * @returns true se il token è scaduto, false altrimenti
 */
export function isTokenExpired(token: string): boolean {
    try {
        const decoded = decodeJWT(token)
        if (!decoded || !decoded.exp) {
            return true
        }

        // exp è in secondi, Date.now() è in millisecondi
        const expirationDate = decoded.exp * 1000
        const now = Date.now()

        return now >= expirationDate
    } catch (error) {
        console.error('Errore nella verifica della scadenza del token:', error)
        return true
    }
}

export default {
    decodeJWT,
    isTokenExpired
}
