<template>
    <div v-if="vobj" class="um-tab-layout">
        <q-scroll-area class="um-tab-scroll">
            <div class="um-tab-container">
                <q-banner v-if="userDetailsForm.failedLoginAttempts >= 3" rounded dense class="bg-warning q-mb-sm">
                    <template v-slot:avatar><q-icon name="warning" /></template>
                    {{ $t('managers.usersManagement.blockedUserInfo') }}
                    <template v-slot:action>
                        <q-btn icon="lock" color="primary" :label="$t('managers.usersManagement.unlockUser')" @click="unlockUser" />
                    </template>
                </q-banner>
                <q-banner v-if="tenant?.TENANT_MFA" rounded inline-actions dense class="bg-info q-mb-sm">
                    {{ $t('managers.usersManagement.multifactor') }}
                    <template v-slot:action>
                        <q-btn flat color="primary" :label="$t('common.reset')" @click="resetMFA" />
                    </template>
                </q-banner>

                <q-card>
                    <q-card-section class="q-py-sm">
                        <div class="um-section-label">{{ $t('managers.usersManagement.detail') }}</div>
                    </q-card-section>
                    <q-separator />
                    <q-card-section>
                        <div class="row q-col-gutter-sm">
                            <div class="col-6">
                                <q-input outlined dense hide-bottom-space v-model="vobj.userDetailsForm.userId.$model" :label="$t('managers.usersManagement.form.userId') + ' *'" :maxLength="100" :disable="!formInsert || disableUsername" :error="vobj.userDetailsForm.userId.$invalid && vobj.userDetailsForm.userId.$dirty" :error-message="vobj.userDetailsForm.userId.$errors[0]?.$message" @update:model-value="onDataChange(vobj.userDetailsForm.userId)" />
                            </div>
                            <div class="col-6">
                                <q-input outlined dense hide-bottom-space v-model="vobj.userDetailsForm.fullName.$model" :label="$t('managers.usersManagement.fullName') + ' *'" autocomplete="off" :maxLength="250" :error="vobj.userDetailsForm.fullName.$invalid && vobj.userDetailsForm.fullName.$dirty" :error-message="vobj.userDetailsForm.fullName.$errors[0]?.$message" @update:model-value="onDataChange(vobj.userDetailsForm.fullName)" />
                            </div>
                            <div class="col-6">
                                <q-input outlined dense hide-bottom-space readonly :model-value="formatPwdDate(userDetailsForm.dtPwdBegin)" :label="$t('managers.usersManagement.form.dtPwdBegin')" />
                            </div>
                            <div class="col-6">
                                <q-input outlined dense hide-bottom-space readonly :model-value="formatPwdDate(userDetailsForm.dtPwdEnd)" :label="$t('managers.usersManagement.form.dtPwdEnd')" />
                            </div>
                        </div>
                    </q-card-section>
                </q-card>

                <q-card>
                    <q-card-section class="q-py-sm">
                        <div class="um-section-label">{{ $t('managers.usersManagement.form.password') }}</div>
                    </q-card-section>
                    <q-separator />
                    <q-card-section>
                        <div class="row q-col-gutter-sm">
                            <div class="col-6">
                                <q-input
                                    outlined
                                    dense
                                    hide-bottom-space
                                    v-model="vobj.userDetailsForm.password.$model"
                                    :type="isPwd ? 'password' : 'text'"
                                    :label="$t('common.password') + ' *'"
                                    autocomplete="new-password"
                                    :error="vobj.userDetailsForm.password.$invalid && vobj.userDetailsForm.password.$dirty"
                                    :error-message="vobj.userDetailsForm.password.$errors[0]?.$message || $t('common.validation.' + vobj.userDetailsForm.password.$errors[0]?.$validator)"
                                    @update:model-value="onDataChange(vobj.userDetailsForm.password)"
                                >
                                    <template v-slot:append>
                                        <q-icon :name="isPwd ? 'visibility' : 'visibility_off'" class="cursor-pointer" @click="isPwd = !isPwd" />
                                    </template>
                                </q-input>
                            </div>
                            <div class="col-6">
                                <q-input
                                    outlined
                                    dense
                                    hide-bottom-space
                                    v-model="vobj.userDetailsForm.passwordConfirm.$model"
                                    :type="isPwdC ? 'password' : 'text'"
                                    :label="$t('managers.usersManagement.form.passwordConfirm') + ' *'"
                                    autofill="off"
                                    :error="vobj.userDetailsForm.passwordConfirm.$invalid && vobj.userDetailsForm.passwordConfirm.$dirty"
                                    :error-message="vobj.userDetailsForm.passwordConfirm.$errors[0]?.$message"
                                    @update:model-value="onDataChange(vobj.userDetailsForm.passwordConfirm)"
                                >
                                    <template v-slot:append>
                                        <q-icon :name="isPwdC ? 'visibility' : 'visibility_off'" class="cursor-pointer" @click="isPwdC = !isPwdC" />
                                    </template>
                                </q-input>
                            </div>
                            <div class="col-12">
                                <q-toggle v-model="userDetailsForm.flgPwdBlocked" :label="$t('managers.usersManagement.flgPwdBlocked')" dense @update:model-value="$emit('dataChanged')" />
                            </div>
                        </div>
                    </q-card-section>
                </q-card>
            </div>
        </q-scroll-area>
    </div>
</template>

<script lang="ts">
import { mapActions } from 'pinia'
import { defineComponent } from 'vue'
import mainStore from '@/App.store'
import { AxiosResponse } from 'axios'
import { DateTime } from 'luxon'

export default defineComponent({
    name: 'roles-tab',
    props: {
        formValues: Object,
        disabledUID: Boolean,
        vobj: Object,
        tenant: {
            type: Object,
            required: false
        },
        formInsert: {
            type: Boolean,
            default: false
        }
    },
    emits: ['unlock', 'dataChanged'],
    data() {
        return {
            userDetailsForm: {} as any,
            defaultRole: null,
            hiddenForm: true as boolean,
            disableUsername: true as boolean,
            loading: false as boolean,
            isPwd: true as boolean,
            isPwdC: true as boolean
        }
    },
    watch: {
        formValues: {
            handler: function (values) {
                this.userDetailsForm = values
                this.userDetailsForm.password = null
                this.userDetailsForm.passwordConfirm = null
            }
        },
        disabledUID: {
            handler: function (value) {
                this.disableUsername = value
            }
        }
    },
    created() {
        this.userDetailsForm = this.formValues
        this.userDetailsForm.password = null
        this.userDetailsForm.passwordConfirm = null
        this.disableUsername = this.disabledUID
    },
    methods: {
        ...mapActions(mainStore, ['setLoading', 'setInfo']),
        // date + time for now; revert to date-only later if too long
        formatPwdDate(value: string): string {
            if (!value) return '-'
            let dt = DateTime.fromISO(value)
            if (!dt.isValid) dt = DateTime.fromSQL(value)
            return dt.isValid ? dt.toFormat('dd/MM/yyyy HH:mm') : value
        },
        unlockUser() {
            this.$emit('unlock')
        },
        onDataChange(v$Comp) {
            v$Comp.$touch()
            this.$emit('dataChanged')
        },
        async resetMFA() {
            this.setLoading(true)
            await this.$http
                .put(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/users/${this.userDetailsForm.id}/resetOtp`)
                .then((response: AxiosResponse<any>) => {
                    this.setInfo({
                        msg: this.$t('managers.usersManagement.info.resetSuccessful')
                    })
                })
                .finally(() => this.setLoading(false))
        }
    }
})
</script>

<style lang="scss" scoped>
.um-tab-layout {
    display: flex;
    flex-direction: column;
    flex: 1;
    background-color: #f3f3f3;
    overflow: hidden;
    height: 100%;
}
.um-tab-scroll {
    flex: 1;
}
.um-tab-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.um-section-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.54);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}
</style>
