# Admin authentication

The admin uses an eight-hour, HttpOnly HMAC-signed cookie. Generate a password hash with `pnpm admin:hash-password` and set it as `ADMIN_PASSWORD_HASH`; never set `ADMIN_PASSWORD`. Generate `SESSION_SECRET` with `openssl rand -base64 48`.

Use the exact same generated hash in every environment. In `.env`, escape the dollar signs inside double quotes, for example `ADMIN_PASSWORD_HASH="scrypt\$16384\$8\$1\$salt\$derivedKey"`. In Vercel, enter the raw value `scrypt$16384$8$1$salt$derivedKey`, without backslashes. The application normalizes this transport difference before verification.

Compare the loaded hash without exposing it with `pnpm admin:hash-fingerprint`. The output is a 12-character SHA-256 prefix; equal fingerprints prove the logical hash is equal.

Use `pnpm admin:verify-password` to check the local password and hash without exposing either value. The username is trimmed but not lowercased; the password is never trimmed.

To update Vercel credentials:

```text
vercel env rm ADMIN_USER production
vercel env add ADMIN_USER production

vercel env rm ADMIN_PASSWORD_HASH production
vercel env add ADMIN_PASSWORD_HASH production

vercel env rm SESSION_SECRET production
vercel env add SESSION_SECRET production

openssl rand -base64 48
vercel --prod
```

Login rate limiting allows five failed attempts per IP in ten minutes. It is intentionally an in-memory guard for this small deployment and is not a distributed protection for serverless multi-instance deployments. Use a shared store such as Redis before relying on it at scale.
