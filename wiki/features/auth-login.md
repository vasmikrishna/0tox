# Auth — Login page

Custom email + password authentication (no Supabase Auth). Session stored as a
signed JWT cookie scoped to the parent domain in production.

## Surfaces

| Path | Purpose |
|------|---------|
| `/login` | Main login page (email + password + phone) |
| `/start` | Registration / onboarding (step 2 has password field) |
| `GET /api/auth/google` | Google OAuth entry point |
| `POST /api/auth/login` | Authenticates email + password; returns role/slug |
| `POST /api/auth/select-workspace` | Finalises login when user belongs to multiple tenants |

## Login form fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Email | `email` | Yes | Identifies the user across tenants |
| Password | `password` / `text` | Yes | Show/hide toggle (eye icon button, `data-testid="login-password-toggle"`) |
| Phone number | `tel` | No | Optional; passed through to the API payload for future use |

## Show/hide password toggle

Implemented as an absolutely-positioned `<button type="button">` inside a
`relative` wrapper around the `<Input>`. Uses Lucide `Eye` / `EyeOff` icons.
Toggle flips the input `type` between `"password"` and `"text"`.

The same toggle is present on the `/start` registration form
(`data-testid="start-password-toggle"`).

## Phone number field

The phone field is **optional** and rendered below the password field. It is
included in the `POST /api/auth/login` JSON payload when non-empty. The current
backend (`src/app/api/auth/login/route.ts`) authenticates by email + password
only and ignores extra fields — this is intentional: the field is future-ready
(e.g. OTP login, SMS notifications) without breaking existing flows.

**Decision:** We chose not to add phone to the backend validation in this PR
because: (a) the `users` table does not currently have a `phone` column,
(b) adding a column requires a migration that should be scoped to a dedicated
issue, and (c) the email-first auth flow is stable and must not regress.

## data-testid catalogue

| Element | testid |
|---------|--------|
| Email input | `login-email` |
| Password input | `login-password` |
| Password show/hide toggle | `login-password-toggle` |
| Phone input | `login-phone` |
| Submit button | `login-submit` |
| Start page password input | `start-password` |
| Start page password toggle | `start-password-toggle` |
