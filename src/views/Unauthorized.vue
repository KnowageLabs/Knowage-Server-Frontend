<template>
    <div class="unauthorized">
        <q-banner class="bg-grey-3 kn-flex">
            <template v-slot:avatar>
                <q-icon name="fa-solid fa-user-lock" color="negative" />
            </template>
            {{ message }}
        </q-banner>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'unauthorized',
    props: ['message']
})
</script>

<style lang="scss" scoped>
.unauthorized {
    height: 100%;
    padding: 0px 20px;
    display: flex;
    align-items: center;
    text-align: center;
}
</style>
