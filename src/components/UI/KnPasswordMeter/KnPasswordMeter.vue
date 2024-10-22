<template>
    <div class="kn-password-meter">
        <div class="bar" :class="`strength-${strength}`" :style="{ width: strength * 20 + '%' }"></div>
    </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    password?: string
}>()

const strength = computed(() => {
    let count = 0
    if (props.password) {
        if (props.password.length >= 8) count++
        if (props.password.match(/(?=.*[0-9])/)) count++
        if (props.password.match(/(?=.*[_,|,-,,#,$])/)) count++
        if (props.password.match(/(?=.*[a-z])/)) count++
        if (props.password.match(/(?=.*[A-Z])/)) count++
    }
    return count
})
</script>
<style lang="scss">
.kn-password-meter {
    width: 100%;
    height: 5px;
    border: 1px solid #eee;
    .bar {
        height: 100%;

        transition: width linear 0.3s;
        &.strength-0 {
            background-color: red;
        }
        &.strength-1 {
            background-color: red;
        }
        &.strength-2 {
            background-color: red;
        }
        &.strength-3 {
            background-color: red;
        }
        &.strength-4 {
            background-color: red;
        }

        &.strength-5 {
            background-color: green;
        }
    }
}
</style>
