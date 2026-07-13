<template>
    <Listbox class="kn-list knUsersListBox" :options="users" list-style="max-height:calc(100% - 66px)" :filter="true" :filter-placeholder="$t('common.search')" filter-match-mode="contains" :filter-fields="['userId', 'fullName']" :empty-filter-message="$t('common.info.noDataFound')" data-test="list">
        <template #option="slotProps">
            <div class="kn-list-item" :class="{ 'router-link-active': isActive(slotProps.option) }" @click="onRowClick(slotProps.option)">
                <q-checkbox :model-value="isChecked(slotProps.option)" dense class="q-mr-xs" @update:model-value="toggleCheck(slotProps.option, $event)" @click.stop />

                <Avatar :icon="avatarIcon(slotProps.option)" shape="circle" :style="avatarStyle(slotProps.option)" />

                <div class="kn-list-item-text">
                    <span v-tooltip.top="slotProps.option.fullName" class="kn-list-item-label">{{ slotProps.option.fullName }}</span>
                    <span class="kn-list-item-text-secondary kn-truncated">{{ slotProps.option.userId }}</span>
                </div>

                <Button v-tooltip.bottom="slotProps.option.flgPwdBlocked ? $t('managers.usersManagement.unlockUser') : $t('managers.usersManagement.lockUser')" :icon="slotProps.option.flgPwdBlocked ? 'fas fa-lock-open' : 'fas fa-lock'" class="p-button-text p-button-rounded p-button-plain" @click.stop="$emit('lockToggle', slotProps.option)" />
                <Button v-tooltip.bottom="$t('common.delete')" icon="far fa-trash-alt" class="p-button-text p-button-rounded p-button-plain" @click.stop="$emit('delete', slotProps.option)" />
            </div>
        </template>
    </Listbox>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Listbox from 'primevue/listbox'
import { iUser } from './UsersManagement'

export default defineComponent({
    name: 'users-management-list',
    components: { Avatar, Button, Listbox },
    props: {
        users: {
            type: Array as PropType<iUser[]>,
            default: () => []
        },
        loading: {
            type: Boolean,
            default: false
        },
        activeUser: {
            type: Object as PropType<iUser | null>,
            default: null
        },
        selectedUsers: {
            type: Array as PropType<iUser[]>,
            default: () => []
        }
    },
    emits: ['select', 'selectionChange', 'delete', 'lockToggle'],
    methods: {
        avatarIcon(user: iUser): string {
            return user.flgPwdBlocked === true ? 'fas fa-lock' : 'fas fa-lock-open'
        },
        avatarStyle(user: iUser): string {
            if (user.flgPwdBlocked === true) return 'background-color:#f44336;color:white'
            if (user.flgPwdBlocked === false) return 'background-color:#4caf50;color:white'
            return 'background-color:#9e9e9e;color:white'
        },
        isActive(user: iUser): boolean {
            return this.activeUser?.id === user.id && this.selectedUsers.length === 0
        },
        isChecked(user: iUser): boolean {
            return this.selectedUsers.some((u) => u.id === user.id)
        },
        onRowClick(user: iUser) {
            if (this.selectedUsers.length > 0) {
                this.toggleCheck(user, !this.isChecked(user))
            } else {
                this.$emit('select', user)
            }
        },
        toggleCheck(user: iUser, checked: boolean) {
            const current = [...this.selectedUsers]
            if (checked) {
                if (!current.some((u) => u.id === user.id)) current.push(user)
            } else {
                const idx = current.findIndex((u) => u.id === user.id)
                if (idx >= 0) current.splice(idx, 1)
            }
            this.$emit('selectionChange', current)
        }
    }
})
</script>

<style lang="scss">
.knUsersListBox {
    .kn-list-item {
        .kn-list-item-label {
            width: 100%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }
}
</style>
