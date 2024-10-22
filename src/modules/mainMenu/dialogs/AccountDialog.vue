<template>
    <q-dialog v-model="props.visible">
        <q-card>
            <q-card-section>
                <img class="tenant-image" v-if="store.user.organizationImageb64Wide" :src="store.user.organizationImageb64" />
                <img class="tenant-image-knowage" v-else :src="publicPath + 'images/commons/knowage.svg'" />
                <div class="text-h6">{{ $t('account.title') }}</div>
                <div class="text-subtitle2">{{ $t('account.subtitle') }}</div>
            </q-card-section>

            <q-card-section>
                <q-input type="text" class="q-mb-sm" filled v-model="account.username" :label="$t('common.user')" disable />
                <q-input type="email" class="q-mb-sm" filled v-model="account.email" :label="$t('common.email')" />
                <q-input bottom-slots type="password" class="password" filled v-model="account.password" :label="$t('common.password')">
                    <template #prepend>
                        <q-icon name="lock" />
                    </template>
                    <template #hint>
                        <kn-password-meter v-if="account.password" class="password-meter" :password="account.password"></kn-password-meter>
                        {{ $t('account.passwordHint.header') }}
                        <ul>
                            <li :class="{ wrongRegex: account?.password?.length < 8 }">{{ $t('account.passwordHint.length') }}</li>
                            <li :class="{ wrongRegex: account?.password && !account?.password?.match(/(?=.*[a-z])/) }">{{ $t('account.passwordHint.lowercase') }}</li>
                            <li :class="{ wrongRegex: account?.password && !account?.password?.match(/(?=.*[A-Z])/) }">{{ $t('account.passwordHint.uppercase') }}</li>
                            <li :class="{ wrongRegex: account?.password && !account?.password?.match(/(?=.*[_,|,-,,#,$])/) }">{{ $t('account.passwordHint.special') }}</li>
                            <li :class="{ wrongRegex: account?.password && !account?.password?.match(/(?=.*[0-9])/) }">{{ $t('account.passwordHint.number') }}</li>
                        </ul>
                    </template>
                </q-input>

                <q-input type="password" class="q-mb-sm" filled v-model="account.confirmPassword" :rules="[(val) => val === account.password || $t('account.error.samePassword')]" :label="$t('common.confirmPassword')">
                    <template #prepend>
                        <q-icon name="lock" />
                    </template>
                </q-input>
            </q-card-section>

            <q-separator dark />

            <q-card-actions class="row justify-end">
                <q-btn unelevated @click="closeDialog">{{ $t('common.close') }}</q-btn>
                <q-btn unelevated color="primary" :disable="!canModify" @click="saveChanges">{{ $t('common.modify') }}</q-btn>
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>
<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import mainStore from '@/App.store'
import axios from 'axios'
import i18n from '@/App.i18n'
import KnPasswordMeter from '@/components/UI/KnPasswordMeter/KnPasswordMeter.vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const { t } = i18n.global
const publicPath = ref(import.meta.env.VITE_PUBLIC_PATH)

const store = mainStore()
const account: any = reactive({})

const props = defineProps<{
    visible: boolean
}>()

const emits = defineEmits(['closed'])

store.$subscribe(
    () => {
        if (store.user) {
            account.username = store.user.userId
            account.email = store.user.email
        }
    },
    { deep: true }
)
const canModify = computed(() => {
    return account.password && account.password === account.confirmPassword && account.password.match(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\-_|#$])[A-Za-z\d\-_|#$]{8,}/)
})

function closeDialog() {
    emits('closed')
}

function saveChanges(): void {
    axios
        .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/signup/update?SBI_EXECUTION_ID=-1', account)
        .then((response: any) => {
            if (response.data.errors) {
                $q.notify({
                    position: 'top',
                    type: 'negative',
                    message: t('account.error.notUpdated', { msg: response.data.errors[0].message })
                })
            } else {
                $q.notify({
                    position: 'top',
                    type: 'info',
                    message: t('account.info.updated')
                })
            }
        })
        .catch((error) =>
            $q.notify({
                position: 'top',
                type: 'negative',
                message: t('account.error.notUpdated', { msg: error })
            })
        )
        .finally(() => {
            delete account.password
            delete account.confirmPassword
        })
}
</script>
<style lang="scss">
.tenant-image {
    width: 100%;
}
.tenant-image-knowage {
    width: 50%;
}
.password {
    margin-bottom: 100px;
    .password-meter {
        position: absolute;
        top: 0;
        left: 0;
    }
    .wrongRegex {
        color: red;
    }
}
</style>
