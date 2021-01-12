<template>
    <v-container>
        <v-card :width="$device.isMobile ? '' : '50%'" class="mx-auto mt-10">
            <v-card-title>{{ register ? 'Sign Up' : 'Log In' }}</v-card-title>
            <v-divider></v-divider>
            <v-form class="px-5" @submit.prevent="onSubmit">
                <v-text-field
                    v-model="username.value"
                    label="Username"
                    :counter="register ? 20 : undefined"
                    :hint="
                        register
                            ? 'Must start with a letter or number and contain only letters, numbers, and underscores'
                            : undefined
                    "
                    autocomplete="username"
                    :error-messages="
                        username.error === '' ? [] : [username.error]
                    "
                ></v-text-field>
                <v-text-field
                    v-show="register"
                    v-model="email.value"
                    label="E-Mail Address"
                    type="email"
                    autocomplete="email"
                    :error-messages="email.error === '' ? [] : [email.error]"
                ></v-text-field>
                <v-text-field
                    v-model="password.value"
                    label="Password"
                    :hint="
                        register
                            ? 'Must be at least 8 characters long'
                            : undefined
                    "
                    :type="password.show ? 'text' : 'password'"
                    :append-icon="password.show ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append="password.show = !password.show"
                    :autocomplete="
                        register ? 'new-password' : 'current-password'
                    "
                    :error-messages="
                        password.error === '' ? [] : [password.error]
                    "
                ></v-text-field>
                <v-text-field
                    v-show="register"
                    v-model="confirm.value"
                    label="Confirm Password"
                    :type="confirm.show ? 'text' : 'password'"
                    :append-icon="confirm.show ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append="confirm.show = !confirm.show"
                    autocomplete="new-password"
                    :error-messages="
                        confirm.error === '' ? [] : [confirm.error]
                    "
                ></v-text-field>
                <v-btn type="submit" class="d-none"></v-btn>
            </v-form>
            <v-divider></v-divider>
            <v-card-actions class="d-flex align-baseline justify-center">
                <v-btn @click="onSubmit" color="success" text>
                    {{ register ? 'Sign Up' : 'Log In' }}
                </v-btn>
                <v-btn text small color="primary" @click="toggleRegister">{{
                    register ? 'Log In' : 'Sign Up'
                }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-container>
</template>

<script lang="ts">
import Vue from 'vue'
import { StatusCodes } from 'http-status-codes'

interface form {
    username: {
        value: string
        error: string
    }
    email: {
        value: string
        error: string
    }
    password: {
        value: string
        error: string
        show: boolean
    }
    confirm: {
        value: string
        error: string
        show: boolean
    }
    register: boolean
}

export default Vue.extend({
    name: 'Index',
    head: { title: 'Log In or Sign Up' },
    auth: 'guest',
    data: () => {
        const form: form = {
            username: {
                value: '',
                error: ''
            },
            email: {
                value: '',
                error: ''
            },
            password: {
                value: '',
                error: '',
                show: false
            },
            confirm: {
                value: '',
                error: '',
                show: false
            },
            register: false
        }

        return { ...form }
    },
    methods: {
        toggleRegister() {
            this.email.value = ''
            this.confirm.value = ''
            this.username.error = ''
            this.email.error = ''
            this.password.error = ''
            this.confirm.error = ''
            this.register = !this.register
        },
        async onSubmit() {
            if (this.register) {
                try {
                    const { username } = await this.$axios.$post(
                        '/api/auth/register',
                        {
                            username: this.username.value,
                            password: this.password.value,
                            email: this.email.value,
                            confirm: this.confirm.value
                        }
                    )

                    this.password.value = ''
                    this.username.value = username
                    this.register = false
                } catch (err) {
                    if (
                        err.response.status !== StatusCodes.UNPROCESSABLE_ENTITY
                    )
                        return this.$nuxt.error({
                            message: err.message ?? err.response?.data?.error,
                            statusCode: err.response?.status
                        })

                    for (const { param, msg } of err.response.data.errors) {
                        switch (param) {
                            case 'username':
                                this.username.error = msg
                                break
                            case 'email':
                                this.email.error = msg
                                break
                            case 'password':
                                this.password.error = msg
                                break
                            case 'confirm':
                                this.confirm.error = msg
                                break
                        }
                    }
                }
            } else {
                try {
                    await this.$auth.loginWith('local', {
                        data: {
                            username: this.username.value,
                            password: this.password.value
                        }
                    })
                } catch (err) {
                    if (err.response.status === StatusCodes.CONFLICT) {
                        this.username.error = err.response.data.error
                        this.password.error = ' '
                    } else
                        this.$nuxt.error({
                            message: err.message ?? err.response?.data?.error,
                            statusCode: err.response?.status
                        })
                }
            }
        }
    }
})
</script>