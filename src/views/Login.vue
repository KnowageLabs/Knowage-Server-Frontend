<template>
    <div class="login-container">
        <q-card class="login-card">
            <q-card-section class="text-center q-pb-none">
                <div class="logo-container">
                    <img :src="`${publicPath}/images/commons/knowage-black.svg`" alt="Knowage" class="logo" />
                </div>
            </q-card-section>

            <q-card-section>
                <q-form @submit="onSubmit" class="q-gutter-md">
                    <q-input v-model="username" :label="$t('common.loginPage.username')" outlined dense :rules="[(val) => !!val || $t('common.loginPage.usernameRequired')]" autocomplete="username">
                        <template v-slot:prepend>
                            <q-icon name="person" />
                        </template>
                    </q-input>

                    <q-input v-model="password" :type="isPwd ? 'password' : 'text'" :label="$t('common.loginPage.password')" outlined dense :rules="[(val) => !!val || $t('common.loginPage.passwordRequired')]" autocomplete="current-password">
                        <template v-slot:prepend>
                            <q-icon name="lock" />
                        </template>
                        <template v-slot:append>
                            <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd" />
                        </template>
                    </q-input>

                    <div>
                        <q-btn :label="$t('common.loginPage.signIn')" type="submit" color="primary" class="full-width" :loading="loading" />
                    </div>
                </q-form>
            </q-card-section>

            <q-card-section class="text-center q-pt-none">
                <div class="text-caption text-grey-7">
                    <a href="#" class="text-primary">{{ $t('common.loginPage.forgotPassword') }}</a>
                </div>
            </q-card-section>
        </q-card>

        <!-- Banner errore -->
        <q-banner v-if="error" class="bg-negative text-white error-banner" rounded>
            <template v-slot:avatar>
                <q-icon name="error" color="white" />
            </template>
            {{ error }}
        </q-banner>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import mainStore from '@/App.store'
import { loadLanguageAsync } from '@/App.i18n.js'
import { decodeJWT } from '@/helpers/commons/jwtHelper'

const router = useRouter()
const $q = useQuasar()
const { t } = useI18n()
const store = mainStore()

const username = ref('')
const password = ref('')
const isPwd = ref(true)
const loading = ref(false)
const error = ref('')
const publicPath = import.meta.env.VITE_PUBLIC_PATH

const onSubmit = async () => {
    loading.value = true
    error.value = ''

    try {
        // Chiamata API per login che restituisce il token JWT
        /*const loginResponse = await axios.post(`${import.meta.env.VITE_KNOWAGE_CONTEXT}/servlet/AdapterHTTP?ACTION_NAME=LOGIN_ACTION`, {
            username: username.value,
            password: password.value
        })*/
        const loginResponse = {
            data: {
                userUniqueIdentifier: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiYmlhZG1pbiIsImV4cCI6MTc2OTAyODY1MH0.9F34kWTYOPvKS4YdBrc5zOiGb4WCB-y6wEvFhBzjiMg'
            }
        }

        // Verifica che ci sia il token nella risposta
        if (loginResponse.data && loginResponse.data.userUniqueIdentifier) {
            const token = loginResponse.data.userUniqueIdentifier

            // Salva il token JWT in localStorage
            localStorage.setItem('token', token)

            // Decodifica il JWT per ottenere i dati dell'utente
            const currentUser = decodeJWT(token)

            if (!currentUser) {
                throw new Error(t('common.loginPage.invalidToken'))
            }

            // Gestisci il session role
            if (localStorage.getItem('sessionRole')) {
                currentUser.sessionRole = localStorage.getItem('sessionRole')
            } else if (currentUser.defaultRole) {
                currentUser.sessionRole = currentUser.defaultRole
            }

            // Inizializza l'utente nello store
            store.initializeUser(currentUser)

            // Gestisci locale
            const responseLocale = currentUser.locale || 'en_US'
            let storedLocale = responseLocale.replace('_', '-')
            if (localStorage.getItem('locale')) {
                storedLocale = localStorage.getItem('locale')
            }
            localStorage.setItem('locale', storedLocale)
            store.setLocale(storedLocale)
            await loadLanguageAsync(storedLocale)

            // Redirect alla home o alla pagina richiesta
            const redirect = (router.currentRoute.value.query.redirect as string) || '/'
            router.push(redirect)
        } else {
            error.value = t('common.loginPage.loginError')
            $q.notify({
                type: 'negative',
                message: error.value,
                position: 'top'
            })
        }
    } catch (err: any) {
        console.error('Errore durante il login:', err)

        // Pulisci il token se il login fallisce
        localStorage.removeItem('token')

        error.value = err.response?.data?.message || t('common.loginPage.loginError')

        $q.notify({
            type: 'negative',
            message: error.value,
            position: 'top'
        })
    } finally {
        loading.value = false
    }
}
</script>

<style scoped lang="scss">
.login-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
}

.login-card {
    width: 100%;
    max-width: 450px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    border-radius: 12px;
}

.logo-container {
    display: flex;
    justify-content: center;
    padding: 20px 0;
}

.logo {
    max-width: 250px;
    height: auto;
}

.error-banner {
    margin-top: 20px;
    max-width: 450px;
    width: 100%;
}

:deep(.q-field__control) {
    height: 48px;
}

:deep(.q-btn) {
    height: 48px;
    font-weight: 600;
    text-transform: none;
    font-size: 16px;
}
</style>
