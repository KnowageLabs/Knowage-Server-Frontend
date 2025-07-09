<template>
    <q-card v-if="vobj">
        <q-toolbar class="kn-toolbar kn-toolbar--secondary">
            <q-toolbar-title>{{ $t('managers.usersManagement.detail') }}</q-toolbar-title>
        </q-toolbar>
        <q-card-section class="row q-gutter-sm">
            <q-banner v-if="userDetailsForm.failedLoginAttempts >= 3" rounded dense class="bg-warning q-ma-sm text-center">
                <template v-slot:avatar>
                    <q-icon name="warning" />
                </template>
                {{ $t('managers.usersManagement.blockedUserInfo') }}
                <template v-slot:action>
                    <q-btn icon="lock" color="primary" :label="$t('managers.usersManagement.unlockUser')" @click="unlockUser" />
                </template>
            </q-banner>
            <q-input filled v-model="vobj.userDetailsForm.userId.$model" :label="$t('managers.usersManagement.form.userId') + ' *'" :maxLength="100" :disable="!formInsert || disableUsername" class="col-12" :error="vobj.userDetailsForm.userId.$invalid && vobj.userDetailsForm.userId.$dirty" :error-message="vobj.userDetailsForm.userId.$errors[0]?.$message" @update:model-value="onDataChange(vobj.userDetailsForm.userId)" />
            <q-input filled v-model="vobj.userDetailsForm.fullName.$model" :label="$t('managers.usersManagement.fullName') + ' *'" autocomplete="off" :maxLength="250" class="col-12" :error="vobj.userDetailsForm.fullName.$invalid && vobj.userDetailsForm.fullName.$dirty" :error-message="vobj.userDetailsForm.fullName.$errors[0]?.$message" @update:model-value="onDataChange(vobj.userDetailsForm.fullName)" />
            <q-input
                v-model="vobj.userDetailsForm.password.$model"
                filled
                :type="isPwd ? 'password' : 'text'"
                :label="$t('common.password') + ' *'"
                autocomplete="new-password"
                class="col-12"
                :error="vobj.userDetailsForm.password.$invalid && vobj.userDetailsForm.password.$dirty"
                :error-message="vobj.userDetailsForm.password.$errors[0]?.$message || $t('common.validation.' + vobj.userDetailsForm.password.$errors[0]?.$validator)"
                @update:model-value="onDataChange(vobj.userDetailsForm.password)"
            >
                <template v-slot:append>
                    <q-icon :name="isPwd ? 'visibility' : 'visibility_off'" class="cursor-pointer" @click="isPwd = !isPwd" />
                </template>
            </q-input>
            <q-input
                v-model="vobj.userDetailsForm.passwordConfirm.$model"
                filled
                :type="isPwdC ? 'password' : 'text'"
                :label="$t('managers.usersManagement.form.passwordConfirm') + ' *'"
                autofill="off"
                class="col-12"
                :error="vobj.userDetailsForm.passwordConfirm.$invalid && vobj.userDetailsForm.passwordConfirm.$dirty"
                :error-message="vobj.userDetailsForm.passwordConfirm.$errors[0]?.$message"
                @update:model-value="onDataChange(vobj.userDetailsForm.passwordConfirm)"
            >
                <template v-slot:append>
                    <q-icon :name="isPwd ? 'visibility' : 'visibility_off'" class="cursor-pointer" @click="isPwd = !isPwd" />
                </template>
            </q-input>
        </q-card-section>
    </q-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'roles-tab',
    props: {
        formValues: Object,
        disabledUID: Boolean,
        vobj: Object,
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
        unlockUser() {
            this.$emit('unlock')
        },
        onDataChange(v$Comp) {
            v$Comp.$touch()
            this.$emit('dataChanged')
        }
    }
})
</script>
