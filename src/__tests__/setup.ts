/**
 * Setup globale per tutti i test Vitest.
 * Garantisce che Pinia sia attiva prima che qualsiasi modulo venga importato,
 * evitando l'errore "getActivePinia() was called but there was no active Pinia"
 * causato da store usati a livello top-level nei moduli.
 */
import { createPinia, setActivePinia } from 'pinia'

setActivePinia(createPinia())
