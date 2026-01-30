<template>
    <q-card-section class="text-center">
        <div class="text-h6 q-mb-md">{{ $t('common.loginPage.mfaTitle') }}</div>
        <div class="text-body2 text-grey-7 q-mb-md">{{ $t('common.loginPage.mfaSubtitle') }}</div>

        <!-- QR Code Image -->
        <div v-if="qrCodeUrl" class="qr-code-container q-mb-lg">
            <img :src="qrCodeUrl" alt="QR Code" class="qr-code" />
        </div>

        <!-- 6 digit input fields -->
        <div class="code-inputs-container q-mb-md">
            <q-input v-for="(digit, index) in code" :key="index" :ref="(el) => (inputRefs[index] = el as any)" v-model="code[index]" outlined square maxlength="1" class="code-input" input-class="text-center" @update:model-value="(val) => handleInput(index, val as string)" @keydown="handleKeydown($event, index)" @paste="handlePaste($event, index)" />
        </div>

        <!-- Submit button -->
        <q-btn :label="$t('common.loginPage.verify')" color="primary" class="full-width" :loading="loading" :disable="!isCodeComplete" @click="onVerify" />
    </q-card-section>

    <!-- Error banner -->
    <q-card-section v-if="error" class="q-pt-none">
        <q-banner class="bg-negative text-white" rounded dense>
            <template v-slot:avatar>
                <q-icon name="error" color="white" />
            </template>
            {{ error }}
        </q-banner>
    </q-card-section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'

interface MfaVerificationProps {
    tokenMfa: string
    secret?: string
    qrCodeUrl?: string
}

interface MfaVerificationEmits {
    (e: 'success', token: string): void
    (e: 'error', message: string): void
}

const props = defineProps<MfaVerificationProps>()
const emit = defineEmits<MfaVerificationEmits>()

const { t } = useI18n()

const code = ref<string[]>(['', '', '', '', '', ''])
const inputRefs = ref<any[]>([])
const loading = ref(false)
const error = ref('')

const isCodeComplete = computed(() => {
    return code.value.every((digit) => digit.length === 1)
})

const handleInput = (index: number, value: string) => {
    // Se il valore è vuoto, non fare nulla
    if (!value) {
        return
    }

    // Prendi solo l'ultimo carattere se ne sono stati digitati più di uno
    const lastChar = value.slice(-1)

    // Assicurati che sia un numero
    if (!/^\d$/.test(lastChar)) {
        code.value[index] = ''
        return
    }

    // Aggiorna il valore con solo l'ultimo carattere
    code.value[index] = lastChar

    // Passa automaticamente al campo successivo
    if (index < 5) {
        nextTick(() => {
            const nextInput = inputRefs.value[index + 1]
            if (nextInput) {
                nextInput.focus()
            }
        })
    }
}

const handleKeydown = (event: KeyboardEvent, index: number) => {
    // Gestisci il tasto backspace
    if (event.key === 'Backspace' && !code.value[index] && index > 0) {
        nextTick(() => {
            inputRefs.value[index - 1]?.focus()
        })
    }
    // Gestisci le frecce
    else if (event.key === 'ArrowLeft' && index > 0) {
        nextTick(() => {
            inputRefs.value[index - 1]?.focus()
        })
    } else if (event.key === 'ArrowRight' && index < 5) {
        nextTick(() => {
            inputRefs.value[index + 1]?.focus()
        })
    }
}

const handlePaste = (event: ClipboardEvent, index: number) => {
    event.preventDefault()
    const pastedData = event.clipboardData?.getData('text') || ''
    const digits = pastedData.replace(/\D/g, '').split('').slice(0, 6)

    // Riempi i campi con i caratteri incollati
    digits.forEach((digit, i) => {
        if (index + i < 6) {
            code.value[index + i] = digit
        }
    })

    // Sposta il focus all'ultimo campo riempito o al successivo
    const lastFilledIndex = Math.min(index + digits.length - 1, 5)
    nextTick(() => {
        inputRefs.value[lastFilledIndex]?.focus()
    })
}

const onVerify = async () => {
    loading.value = true
    error.value = ''

    try {
        const payload: any = {
            code: code.value.join(''),
            tokenMfa: props.tokenMfa
        }

        if (props.secret) {
            payload.secret = props.secret
        }

        const response = await axios.post(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/restful-services/login/verifyMfa`, payload)

        if (response.data && response.data.token) {
            emit('success', response.data.token)
        } else {
            error.value = t('common.loginPage.mfaError')
            emit('error', error.value)
        }
    } catch (err: any) {
        console.error('Errore durante la verifica MFA:', err)
        error.value = err.response?.data?.message || t('common.loginPage.mfaError')
        emit('error', error.value)
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    // Focus sul primo campo all'avvio
    nextTick(() => {
        inputRefs.value[0]?.focus()
    })
})

// Submit automatico quando il codice è completo
watch(isCodeComplete, (complete) => {
    if (complete) {
        nextTick(() => {
            onVerify()
        })
    }
})
</script>

<style scoped lang="scss">
.qr-code-container {
    display: flex;
    justify-content: center;
    padding: 20px;
    background: white;
    border-radius: 8px;
    margin: 0 auto;
    max-width: 250px;
}

.qr-code {
    width: 200px;
    height: 200px;
}

.code-inputs-container {
    display: flex;
    gap: 8px;
    justify-content: center;
}

.code-input {
    width: 50px;

    :deep(.q-field__control) {
        height: 60px;
    }

    :deep(.q-field__native) {
        font-size: 24px;
        font-weight: 600;
    }
}

:deep(.q-btn) {
    height: 48px;
    font-weight: 600;
    text-transform: none;
    font-size: 16px;
}
</style>
