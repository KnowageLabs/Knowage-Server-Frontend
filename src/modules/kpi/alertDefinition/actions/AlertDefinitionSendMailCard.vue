<template>
    <span class="p-float-label p-m-4">
        <AutoComplete id="mailTo" v-model="selectedUsers" class="p-inputtext-sm" :multiple="true" :suggestions="filteredUsers" field="name" @keydown.enter="createMailChip" @complete="searchUsers($event)" @item-select="setUser($event.value)" />
        <label for="mailTo" class="kn-material-input-label"> {{ $t('kpi.alert.mailTo') }}</label>
        <small id="chips-help">{{ $t('common.chipsHint') }}</small>
    </span>
    <span class="p-float-label p-m-4">
        <InputText id="mailSubject" v-model.trim="selectedAction.jsonActionParameters.subject" class="kn-material-input" />
        <label for="mailSubject" class="kn-material-input-label"> {{ $t('kpi.alert.mailSubject') }}</label>
    </span>
    <div class="p-field">
        <q-editor ref="editor" id="html" class="q-ma-sm" v-model="selectedAction.jsonActionParameters.body" min-height="260px" />
    </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import AutoComplete from 'primevue/autocomplete'

export default defineComponent({
    name: 'send-mail-card',
    components: { AutoComplete },
    props: {
        action: {
            type: Object
        },
        users: {
            type: Array
        }
    },
    data() {
        return {
            selectedAction: {} as any,
            userList: [] as any[],
            selectedUsers: [] as any[],
            filteredUsers: [] as any[]
        }
    },
    watch: {
        users() {
            this.loadUsers()
        }
        // mailTo: [{ name: 'demo_admin', userId: '', email: 'demo_admin' }],
    },
    created() {
        this.loadAction()
        this.loadUsers()
    },
    methods: {
        loadAction() {
            this.selectedAction = this.action
            this.selectedUsers = this.selectedAction?.jsonActionParameters?.mailTo ? this.selectedAction.jsonActionParameters.mailTo : []
        },
        loadUsers() {
            this.userList = this.users as any[]
        },
        searchUsers(event) {
            setTimeout(() => {
                if (!event.query.trim().length) {
                    this.filteredUsers = [...this.userList] as any[]
                } else {
                    this.filteredUsers = this.userList.filter((user: any) => {
                        return user.name.toLowerCase().startsWith(event.query.toLowerCase()) || user.email.toLowerCase().startsWith(event.query.toLowerCase())
                    })
                }
            }, 250)
        },
        createMailChip(event: any) {
            if (event.target.value) {
                this.selectedUsers.push({ name: event.target.value, userId: '', email: event.target.value })
                this.userList.push({ name: event.target.value, userId: '', email: event.target.value })
                event.target.value = ''
                this.selectedAction.jsonActionParameters.mailTo = this.selectedUsers
            }
        }
    }
})
</script>
