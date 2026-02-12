# Technical Documentation - Login System

## Overview

The login system consists of a main component `Login.vue` and three child components that handle different authentication scenarios:
- `MfaVerification.vue` - Two-factor authentication (2FA/MFA)
- `ForgotPassword.vue` - Password reset request via email
- `ResetPassword.vue` - Password reset with token

## Architecture

### Login.vue (Main Component)

The main component manages the common layout and orchestrates the different authentication flows.

#### Template Structure

```vue
<q-card class="login-card">
  <!-- Logo (always visible) -->
  <!-- Unified success/error banner -->
  <!-- Dynamic component based on state -->
</q-card>
```

#### Component States

The component can be in one of the following states:

1. **Standard Login** (`v-else`) - Username/password form
2. **MFA Verification** (`showMfa === true`) - 2FA code verification
3. **Forgot Password** (`showForgotPassword === true`) - Password reset request
4. **Reset Password** (`showResetPassword === true`) - Password change with token

#### State Variables

| Variable | Type | Description |
|-----------|------|-------------|
| `username` | `ref<string>` | Username for login |
| `password` | `ref<string>` | Password for login |
| `isPwd` | `ref<boolean>` | Password visibility toggle |
| `loading` | `ref<boolean>` | Loading state |
| `error` | `ref<string>` | Current error message |
| `success` | `ref<string>` | Current success message |
| `loginConfig` | `ref<any>` | Server configurations |
| `showMfa` | `ref<boolean>` | Show MFA component |
| `showForgotPassword` | `ref<boolean>` | Show forgot password component |
| `showResetPassword` | `ref<boolean>` | Show reset password component |
| `resetToken` | `ref<string>` | Token for password reset |
| `mfaData` | `ref<object>` | MFA data (tokenMfa, secret, qrCodeUrl) |

### Standard Login Flow

```
1. User enters username/password
   ↓
2. POST /restful-services/login
   ↓
3a. Response with token → completeLogin()
3b. Response with tokenMfa → Show MFA
   ↓
4. POST /restful-services/2.0/currentuser
   ↓
5. Initialize store and redirect
```

#### `onSubmit()` Function

```typescript
// 1. Reset state
loading.value = true
error.value = ''
success.value = ''

// 2. Login call
POST /restful-services/login
Body: { userID, password }

// 3. Handle response
if (tokenMfa present) → showMfa = true
else if (token present) → completeLogin(token)
else → show error
```

#### `completeLogin(token: string)` Function

```typescript
// 1. Save token
localStorage.setItem('token', token)

// 2. Get user data
GET /restful-services/2.0/currentuser

// 3. Handle role
sessionRole = localStorage or defaultRole

// 4. Initialize store
store.initializeUser(currentUser)

// 5. Handle locale
locale = currentUser.locale || localStorage || 'en_US'
loadLanguageAsync(locale)

// 6. Redirect
router.push(redirect || '/')
```

### Child Components

## 1. MfaVerification.vue

### Purpose
Verify the 6-digit 2FA code after initial login.

### Props
```typescript
interface MfaVerificationProps {
  tokenMfa: string     // Temporary MFA token
  secret?: string      // Secret for first-time setup
  qrCodeUrl?: string   // QR code for authenticator configuration
}
```

### Emitted Events
```typescript
@success(token: string)    // MFA verification completed
@error(message: string)    // Error during verification
```

### Features

#### Code Input
- 6 input fields for single digits
- Auto-focus on next field after input
- Paste support to fill all digits
- Navigation with arrows and backspace
- Auto-submit when all 6 digits are entered

#### Verification Logic

```typescript
// 1. Concatenate the 6 digits
code = code.value.join('')

// 2. Prepare payload
payload = { code, tokenMfa, secret? }

// 3. Verify
POST /restful-services/login/verifyMfa

// 4. On success
emit('success', response.data.token)
```

#### Input Handling

```typescript
handleInput(index, value):
  - Validate it's a number
  - Keep only the last character
  - Auto-focus on next field

handleKeydown(event, index):
  - Backspace: go back to previous field
  - Arrow Left/Right: navigate fields

handlePaste(event, index):
  - Extract numbers from pasted text
  - Fill consecutive fields
  - Focus on last filled field
```

## 2. ForgotPassword.vue

### Purpose
Allow users to request a password reset email.

### Emitted Events
```typescript
@back()                      // Return to login
@success(message: string)    // Email sent successfully
@error(message: string)      // Email sending error
```

### Internal State
```typescript
email: ref<string>           // Entered email
loading: ref<boolean>        // Loading state
emailSent: ref<boolean>      // Email already sent
```

### Flow

```
1. User enters email
   ↓
2. Email format validation
   ↓
3. POST /restful-services/resetPassword/sendEmail
   ↓
4. emailSent = true → hide form
   ↓
5. emit('success') → show message
```

### Dynamic UI

After successful submission:
- The form (email + submit button) is hidden (`v-if="!emailSent"`)
- Only the "Back to Login" button remains visible
- Success message appears in the unified banner

## 3. ResetPassword.vue

### Purpose
Allow password reset when a valid token is available.

### Props
```typescript
interface ResetPasswordProps {
  token: string    // Reset token received via email
}
```

### Emitted Events
```typescript
@success(message: string)    // Password changed
@error(message: string)      // Password change error
```

### Internal State
```typescript
password: ref<string>           // New password
confirmPassword: ref<string>    // Password confirmation
isPwd: ref<boolean>             // Password visibility toggle
isConfirmPwd: ref<boolean>      // Confirmation visibility toggle
loading: ref<boolean>           // Loading state
```

### Validations

```typescript
password:
  - Required: "Password is required"
  - Min length: "Password must be at least 8 characters"

confirmPassword:
  - Required: "Confirm password is required"
  - Match: "Passwords must match"
```

### Flow

```
1. User enters password and confirmation
   ↓
2. Form validation
   ↓
3. POST /restful-services/resetPassword/passwordChange
   Body: { password, confirmPassword, token }
   ↓
4. emit('success') → return to login
```

## Initialization and Routing

### URL Parameters

The component handles the `resetToken` parameter in the URL:

```typescript
onMounted(async () => {
  // 1. Load configurations
  await loadLoginConfig()
  
  // 2. Check resetToken in query params
  const resetToken = route.query.resetToken
  if (resetToken) {
    await verifyResetToken(resetToken)
  }
})
```

### Reset Token Verification

```typescript
verifyResetToken(token: string):
  // 1. Validate token
  POST /restful-services/resetPassword/verifyToken
  Body: { token }
  
  // 2. If valid
  resetToken.value = token
  showResetPassword.value = true
  
  // 3. If invalid
  error.value = "Invalid or expired reset token"
```

### Login Configuration

```typescript
loadLoginConfig():
  // 1. Get configurations
  GET /restful-services/loginconfig
  
  // 2. If defaultLanguage is present
  loginConfig.value.items[0].defaultLanguage
  
  // 3. Set language
  localStorage.setItem('locale', locale)
  store.setLocale(locale)
  locale.value = locale
  loadLanguageAsync(locale)
```

#### LoginConfig Response Structure

```json
{
  "items": [
    {
      "defaultLanguage": "en-US",
      "oauth2FlowType": "NONE",
      "ssoActive": "false"
    }
  ]
}
```

## Unified Notification System

The component uses a unified banner system to display success and error messages.

### Banner Positioning

Banners are positioned:
- After the logo
- Before any form/component
- Inside the main card

### Message Management

```typescript
// All child components emit events
// The parent component handles the display

// Example: MFA Error
onMfaError(message: string) {
  error.value = message
  success.value = ''  // Clear success
  showMfa.value = false
}

// Example: Forgot Password Success
onForgotPasswordSuccess(message: string) {
  success.value = message
  error.value = ''  // Clear error
}
```

### Banner Reset on State Change

```typescript
// When switching components, banners are cleared

openForgotPassword() {
  showForgotPassword.value = true
  error.value = ''
  success.value = ''
}

onForgotPasswordBack() {
  showForgotPassword.value = false
  error.value = ''
  success.value = ''
}

onSubmit() {  // Login submit
  loading.value = true
  error.value = ''
  success.value = ''
  // ...
}
```

## API Endpoints

### Authentication

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/restful-services/loginconfig` | GET | - | `{ items: [{ defaultLanguage, oauth2FlowType, ssoActive }] }` |
| `/restful-services/login` | POST | `{ userID, password }` | `{ token } or { tokenMfa, secret?, qrCodeUrl? }` |
| `/restful-services/2.0/currentuser` | GET | - | `{ user data }` |
| `/restful-services/login/verifyMfa` | POST | `{ code, tokenMfa, secret? }` | `{ token }` |

### Password Reset

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/restful-services/resetPassword/sendEmail` | POST | `{ email }` | Success/Error |
| `/restful-services/resetPassword/verifyToken` | POST | `{ token }` | Success/Error |
| `/restful-services/resetPassword/passwordChange` | POST | `{ password, confirmPassword, token }` | Success/Error |

## Internationalization

### Translation Keys

All translations are under `common.loginPage`:

```json
{
  "common": {
    "loginPage": {
      // Login Form
      "username": "Username",
      "password": "Password",
      "signIn": "Sign in",
      "forgotPassword": "Forgot password?",
      "usernameRequired": "Username is required",
      "passwordRequired": "Password is required",
      "loginError": "Invalid credentials. Please try again.",
      
      // MFA
      "mfaTitle": "Two-Factor Authentication",
      "mfaSubtitle": "Enter the 6-digit code from your authenticator app",
      "verify": "Verify",
      "mfaError": "Invalid code. Please try again.",
      
      // Forgot Password
      "forgotPasswordTitle": "Reset Password",
      "forgotPasswordSubtitle": "Enter your email address...",
      "email": "Email",
      "emailRequired": "Email is required",
      "emailInvalid": "Please enter a valid email address",
      "sendResetEmail": "Send Reset Email",
      "backToLogin": "Back to Login",
      "resetEmailSent": "Reset email sent successfully...",
      "resetEmailError": "Failed to send reset email...",
      
      // Reset Password
      "resetPasswordTitle": "Reset Password",
      "resetPasswordSubtitle": "Enter your new password",
      "newPassword": "New Password",
      "confirmPassword": "Confirm Password",
      "confirmPasswordRequired": "Confirm password is required",
      "passwordsMustMatch": "Passwords must match",
      "passwordMinLength": "Password must be at least 8 characters",
      "resetPassword": "Reset Password",
      "passwordResetSuccess": "Password reset successfully...",
      "passwordResetError": "Failed to reset password...",
      "invalidResetToken": "Invalid or expired reset token."
    }
  }
}
```

### Supported Languages

- English (en-US)
- Italian (it-IT)

Language can be set via:
1. Server configuration (`loginConfig.defaultLanguage`)
2. User preferences (after login, from `currentUser.locale`)
3. LocalStorage (`locale` key)

## Styling

### Background

- Background image: `/images/home/home-background.jpg`
- Semi-transparent white overlay (10% opacity)
- Centered layout with flexbox

### Card

- Max width: 450px
- Border radius: 12px
- Box shadow: `0 10px 40px rgba(0, 0, 0, 0.2)`
- Z-index: 1 (above overlay)

### Buttons

- Height: 48px
- Font weight: 600
- Text transform: none (preserves original capitalization)
- Font size: 16px

### Logo

- Max width: 250px
- Vertical padding: 20px
- Horizontally centered

## Error Handling

### Error Catching

All components catch API call errors and handle them:

```typescript
try {
  // API call
} catch (err: any) {
  console.error('Error description:', err)
  const errorMessage = err.response?.data?.message || t('fallback.key')
  emit('error', errorMessage)
}
```

### State Cleanup

When a critical error occurs:
- Token is removed from localStorage
- Form state is reset
- User is returned to initial state

## Store Management

The component interacts with Pinia `mainStore`:

```typescript
// Initialize user after login
store.initializeUser(currentUser)

// Set locale
store.setLocale(locale)
```

## Router Integration

### Post-Login Redirect

The component handles redirect after login:

```typescript
// 1. From query string (if redirected for authentication)
const redirect = router.currentRoute.value.query.redirect

// 2. Default to home
router.push(redirect || '/')
```

### URL Parameter Removal

After successful password reset:

```typescript
router.replace({ query: {} })  // Clears resetToken from URL
```

## Best Practices

1. **State Management**: All boolean states are mutually exclusive
2. **Unified Banners**: Single point for displaying messages
3. **Message Cleanup**: Messages are cleared on every state change
4. **Form Validation**: Uses Quasar rules for real-time validation
5. **Security**: Token is never exposed in client code (storage only)
6. **UX**: Auto-focus, auto-submit, immediate feedback
7. **Accessibility**: Correct labels, appropriate autocomplete, ARIA

## Flow Diagram

```
┌─────────────┐
│   Landing   │
│   /login    │
└──────┬──────┘
       │
       ├─── resetToken in URL? ──→ Verify Token ──→ ResetPassword
       │                                 ↓
       │                              Invalid
       │                                 ↓
       ├─────────────────────────→ Login Form
       │                              │
       │                              ↓
       │                          Submit Login
       │                              │
       │                      ┌───────┴────────┐
       │                      │                │
       │                  tokenMfa          token
       │                      │                │
       │                      ↓                ↓
       │                MfaVerification   currentUser
       │                      │                │
       │                      └────────┬───────┘
       │                               │
       │                               ↓
       │                         Complete Login
       │                               │
       │                               ↓
       │                            Redirect
       │
       └─── Forgot Password? ──→ ForgotPassword ──→ Email Sent
                                       │
                                       └──→ Back to Login
```

## Troubleshooting

### Issue: Banners not resetting
**Solution**: Verify that every state change handler calls `error.value = ''` and `success.value = ''`

### Issue: Language not updating
**Solution**: Verify that `loadLanguageAsync()` is awaited with `await`

### Issue: MFA not showing QR code
**Solution**: Verify that `qrCodeUrl` is in valid base64 format

### Issue: Reset token not working
**Solution**: Verify that the URL parameter is `resetToken` (case-sensitive) and that the token is valid server-side

## Maintenance

### Adding a New Language

1. Create file in `src/i18n/{locale}/messages.json`
2. Add all keys under `common.loginPage`
3. Test with `loginConfig.defaultLanguage = "{locale}"`

### Adding a New Authentication Flow

1. Create child component in `src/views/`
2. Add boolean variable to show/hide
3. Add conditional in Login.vue template
4. Implement handlers for @success and @error events
5. Add necessary translations

### Modifying API Endpoints

1. Update URL in axios call
2. Update payload/response typing
3. Update documentation in this file
4. Test all affected flows
