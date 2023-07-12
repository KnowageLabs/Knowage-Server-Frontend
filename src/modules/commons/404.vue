<template>
    <center>
        <h1>Not Found!</h1>
        <p>
            <a :href="homeDir">Go home?</a>
        </p>
    </center>
</template>

<script>
export default {
    name: 'not-found',
    data() {
        return {
            homeDir: import.meta.env.VITE_KNOWAGE_CONTEXT
        }
    }
}
</script>

<style scoped>
center {
    margin: 15vw;
}

h1 {
    color: var(--border);
    font-size: 2em;
}
</style>
