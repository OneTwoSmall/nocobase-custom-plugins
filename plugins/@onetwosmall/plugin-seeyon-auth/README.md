# @onetwosmall/plugin-seeyon-auth

Seeyon OA (致远OA) single sign-on authentication plugin for NocoBase.

## Introduction

This plugin enables users to sign in to NocoBase through a Seeyon OA account using the Seeyon OA third-party authentication API. Once a user is authenticated by the OA system, the plugin validates the OA ticket and logs the user into NocoBase automatically, supporting automatic user registration.

## Features

- Single sign-on (SSO) authentication against Seeyon OA via ticket validation
- Supports both v1 (`/admin`) and v2 (`/v/admin`) client runtimes
- Page callback endpoint that validates the ticket and redirects with a JWT token
- JSON API callback for programmatic authentication (`seeyonAuth:callback`)
- Automatic user registration when the user does not exist (optional)
- Configurable user match field (`username` / `email` / `nickname`)
- Cached authenticator and token configuration for better performance
- Security hardening: path traversal and open redirect protection, XSS-safe callback HTML

## Installation

Enable the plugin in the NocoBase plugin management page after installation:

```bash
yarn nocobase pm enable @onetwosmall/plugin-seeyon-auth
```

## Configuration

After enabling the plugin, create an authenticator of type `Seeyon OA` in **Settings > Authentication** and configure the following options:

| Option | Required | Description |
| --- | --- | --- |
| `OA Host` | Yes | The base URL of the Seeyon OA server, e.g. `http://127.0.0.1` |
| `Sign up automatically when the user does not exist` | No | When enabled, a user is created automatically after successful ticket validation if no matching user exists |
| `User Match Field` | No | The field used to match OA users against NocoBase users: `username` (default), `email` or `nickname` |
| `Default Password` | No | The default password used when auto-registering a user. Must contain letters and digits and be at least 8 characters long; defaults to `ABCabc@123` |

## How It Works

1. The user visits the callback URL with the OA ticket:
   - Page callback: `/seeyon-auth/callback?v5ticket=<ticket>` (v1) or `/v/seeyon-auth/callback?v5ticket=<ticket>` (v2)
   - The parameters `ticket` and `token` are also accepted as aliases for `v5ticket`
2. The plugin validates the ticket by calling `{oaHost}/seeyon/thirdpartyController.do?ticket=<ticket>`; the response body is treated as the OA username
3. The user is looked up by the configured match field, or auto-registered if `autoRegister` is enabled
4. On success the plugin issues a NocoBase JWT token and redirects the user (optionally to a `customPath` preserved from the request URL); on failure the user is redirected to the sign-in page

### JSON API Callback

For programmatic authentication, call the resource action:

```bash
curl -X POST http://localhost:13000/api/seeyonAuth:callback \
  -H 'Content-Type: application/json' \
  -d '{"v5ticket": "<ticket>"}'
```

The endpoint returns `{ token, user }` on success, or a `400` / `401` error with a machine-readable `code` (`MISSING_TICKET`, `NO_AUTHENTICATOR`, `AUTH_FAILED`) on failure.

## Security Notes

- Ticket validation requests use a 5-second timeout and errors are never surfaced to the client
- The custom redirect path is sanitized against path traversal (`..`) and restricted to safe characters to prevent open redirects
- Callback HTML escapes all dynamic values to prevent XSS injection
- The `seeyonAuth:callback` action is marked as `public`; ensure the OA endpoint `{oaHost}/seeyon/thirdpartyController.do` is only reachable by trusted clients

## License

This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
For more information, please refer to: https://www.nocobase.com/agreement.
