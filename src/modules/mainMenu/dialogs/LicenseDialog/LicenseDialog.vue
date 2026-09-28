<template>
    <q-dialog :model-value="visibility" @update:model-value="onVisibilityChange">
        <q-card class="kn-license-dialog column no-wrap">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ $t('licenseDialog.title') }}</q-toolbar-title>
            </q-toolbar>

            <q-card-section v-if="hosts.length === 0" class="text-grey-7">{{ $t('licenseDialog.noLicenses') }}</q-card-section>

            <template v-else>
                <!-- One tab for each host. A single host needs no tab bar: the host section shows its name. -->
                <q-tabs v-if="hosts.length > 1" v-model="activeHost" dense align="left" class="kn-tabs" active-color="primary" indicator-color="primary" style="border-bottom: 1px solid #ccc">
                    <q-tab v-for="host in hosts" :key="host.hardwareId" :name="host.hostName" :label="host.hostName" no-caps />
                </q-tabs>
                <q-tab-panels v-model="activeHost" class="col kn-license-dialog__panels">
                    <q-tab-panel v-for="host in hosts" :key="host.hardwareId" :name="host.hostName" class="q-pa-md">
                        <LicenseTab
                            :licenses="licenses.licenses[host.hostName] ?? []"
                            :host="host"
                            :cpunumber="licenses.cpuNumber"
                            :max-admin-users="licenses.maxAdminUsers"
                            :max-end-users="licenses.maxEndUsers"
                            :admin-users-created="licenses.adminUsersCreated"
                            :end-users-created="licenses.endUsersCreated"
                        />
                    </q-tab-panel>
                </q-tab-panels>
            </template>

            <q-card-actions align="right">
                <q-btn class="kn-button kn-button--primary" data-test="close-button" @click="closeDialog">{{ $t('common.close') }}</q-btn>
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapState } from 'pinia'
import mainStore from '@/App.store'
import LicenseTab from './LicenseTab.vue'
import type { iHost } from './License'

export default defineComponent({
    name: 'license-dialog',
    components: { LicenseTab },
    props: {
        visibility: Boolean
    },
    emits: ['update:visibility'],
    data() {
        return {
            activeHost: ''
        }
    },
    computed: {
        ...mapState(mainStore, ['licenses']),
        hosts(): iHost[] {
            return this.licenses?.hosts ?? []
        }
    },
    watch: {
        visibility(value: boolean) {
            if (value && !this.hosts.some((host) => host.hostName === this.activeHost)) this.activeHost = this.hosts[0]?.hostName ?? ''
        }
    },
    methods: {
        onVisibilityChange(value: boolean) {
            if (!value) this.closeDialog()
        },
        closeDialog() {
            this.$emit('update:visibility', false)
        }
    }
})
</script>

<style lang="scss" scoped>
.kn-license-dialog {
    width: 720px;
    max-width: 90vw;
    max-height: 90vh;
}
.kn-license-dialog__panels {
    overflow-y: auto;
}
</style>
