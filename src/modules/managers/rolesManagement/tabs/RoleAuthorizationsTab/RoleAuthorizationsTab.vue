<template>
    <div class="q-ma-sm">
        <q-input v-model="filter" :label="$t('common.search')" dense filled class="q-mb-sm" :debounce="200" />
        <q-card>
            <q-list bordered class="rounded-borders" separator>
                <q-expansion-item v-for="(category, index) of rolesManagementTabViewDescriptor.categories" :key="index" expand-separator header-class="bg-grey-1">
                    <template v-slot:header>
                        <q-item-section avatar>
                            <q-icon :name="category.icon" />
                        </q-item-section>

                        <q-item-section>
                            <q-item-label>{{ $t(category.name) }}</q-item-label>
                            <q-item-label caption>{{ $t(category.caption) }}</q-item-label>
                        </q-item-section>

                        <q-item-section side>
                            <q-badge v-if="authorizationCBs[category.categoryName]" color="primary" :label="badgeNumber(category.categoryName)" />
                        </q-item-section>
                    </template>
                    <q-card v-if="authorizationCBs[category.categoryName] && filteredAuthList(category.categoryName) && filteredAuthList(category.categoryName).length > 0">
                        <q-list color="grey" dense separator>
                            <q-item v-for="(authCBInfo, ind) of filteredAuthList(category.categoryName)" :key="ind">
                                <q-item-section>
                                    <q-item-label>{{ $t(authCBInfo.label) }}</q-item-label>
                                </q-item-section>
                                <q-item-section side top>
                                    <q-toggle v-model="role[authCBInfo.fieldName]" :disabled="authCBInfo.enableForRole && role.roleTypeCD === 'ADMIN'" @update:model-value="authChanged(authCBInfo.fieldName, role[authCBInfo.fieldName])" />
                                </q-item-section>
                            </q-item>
                        </q-list>
                    </q-card>
                </q-expansion-item>
            </q-list>
        </q-card>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import rolesManagementTabViewDescriptor from '../../RolesManagementTabViewDescriptor.json'

export default defineComponent({
    name: 'authorizations-tab',
    props: {
        selectedRole: {
            type: Object,
            required: false
        },
        authList: Array,
        authCBs: Object as any
    },
    emits: ['authChanged'],
    data() {
        return {
            filter: '' as string,
            rolesManagementTabViewDescriptor,
            role: {} as any,
            authorizationList: [] as any,
            authorizationCBs: {} as any
        }
    },
    watch: {
        selectedRole: {
            handler: function (value) {
                this.role = { ...value } as any
            },
            deep: true
        }
    },
    created() {
        this.authorizationList = this.authList as any[]
        this.authorizationCBs = this.authCBs as any[]
        this.role = { ...this.selectedRole } as any
    },
    methods: {
        authChanged(fieldName: string, value: any) {
            this.$emit('authChanged', { fieldName, value })
        },
        filteredAuthList(categoryName: string) {
            return this.authorizationCBs[categoryName].filter((auth) => auth.label.toLowerCase().includes(this.filter.toLowerCase()))
        },
        badgeNumber(categoryName) {
            return `${this.filteredAuthList(categoryName).filter((item) => this.role[item.fieldName]).length} / ${this.filteredAuthList(categoryName).length}`
        }
    }
})
</script>
