# Runtime Reporter

A framework-agnostic, type-safe reporting library that standardizes how clients handle errors and logs.

[![npm version](https://img.shields.io/npm/v/runtime-reporter.svg)](https://www.npmjs.com/package/runtime-reporter)

## Why Runtime Reporter?

Managing client-side error states and telemetry usually leads to duplicated string constants, bloated production bundles, leaking sensitive data, and fragile test assertions. Runtime Reporter fixes this by decoupling your message text from your code logic:

- **Centralized Messaging**: Centralize all user-facing and developer-facing log strings into a single dictionary.
- **Production-Safe & Lightweight**: Pass an empty object in production to cleanly strip out debug strings, protecting sensitive app details and dropping bundle sizes.
- **Compile-Time Token Inference**: Intersperse curly brace variables in your strings and get automatic TypeScript autocomplete and parameter validation.
- **Test-Friendly Assertions**: Compare error events against compiled messages cleanly without copy-pasting raw strings into test files.
- **Traceable Error Codes**: Stable error codes make reports easy to trace from the console back to the exact source message definition in your codebase.

## Who is this for?

- Front-end frameworks, shared component libraries, and SDKs.
- Enterprise projects needing stable error/warning codes for documentation and debugging.
- Teams migrating away from ad-hoc `console.warn` or `console.error` setups.

## Installation

```sh
npm install runtime-reporter
```

## Quick Start

### 1. Define your messages and create your reporter

```ts
import { createReporter } from "runtime-reporter";

const messages = {
    ERR01: "Something went wrong",
    ERR02: "{{ componentName }} failed to mount",
} as const;

const reporter = createReporter(
    // Use an empty message set in production for safer, smaller builds
    process.env.NODE_ENV === "production" ? ({} as typeof messages) : messages
);

export default reporter;
```

### 2. Call the reporter methods from your code

```ts
import reporter from "./my-reporter";

reporter.fail("ERR01");
// Non-production: throws "Something went wrong (ERR01)"
// Production: throws "An error occurred (ERR01)" (Opaque fallback string because the production set is empty)

reporter.error("ERR02", { componentName: "MyComponent" });
// Non-production: logs "MyComponent failed to mount (ERR02)"
// Production: does not log (Safely silenced because the production set is empty)
```

## Features & Core Concepts

### 1. Code-based messaging

Replace arbitrary inline strings with centralized, searchable identifier codes.

```ts
// ❌ Without runtime-reporter: logs "Something went wrong"
console.log("Something went wrong");

// ✅ With runtime-reporter: logs "Something went wrong (ERR01)"
reporter.log("ERR01");
```

### 2. Type-Safe Dynamic Tokens

Inject runtime data via double-curly template parameters; token requirements are fully inferred.

```ts
const reporter = createReporter({
    ERR01: "Something went wrong",
    ERR02: "{{ componentName }} failed to mount",
} as const); // 👈 The "as const" is required

// ✅ Autocomplete & token injection works flawlessly
reporter.error("ERR02", { componentName: "MyComponent" });

// ✅ No second argument needed when the message template has no tokens
reporter.error("ERR01");

// ❌ TypeScript Error: Property componentName is missing
reporter.error("ERR02");

// ❌ TypeScript Error: Token-less messages reject a second argument
reporter.error("ERR01", { componentName: "MyComponent" });

// ❌ TypeScript Error: ERR03 does not exist on your message registry
reporter.error("ERR03", { componentName: "MyComponent" });
```

### 3. Test-Friendly Assertions

The `message()` method compiles your template matching your exact token variables without triggering logs, side effects, or remote API hooks.

```ts
it("should log error if component fails to mount", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(<MyComponent />);

    expect(console.error).toHaveBeenCalledWith(
        reporter.message("ERR02", { componentName: "MyComponent" })
    );
});
```

### 4. Custom Side Effects (`onReport`)

Leverage the `onReport` hook to wire up third-party telemetry options (like Sentry, LogRocket, or custom analytical backend endpoints).

> Note: The `message()` method does not trigger `onReport`.

```ts
const reporter = createReporter(messages, {
    onReport: (payload) => {
        fetch("/api/reports", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },
});

// ✅ Sends a POST request with the following payload:
// {
//     code: "ERR02",
//     message: "MyComponent failed to mount",
//     level: "error",
// }
reporter.error("ERR02", { componentName: "MyComponent" });
```

### 5. One-Time Warnings

Use `warnOnce()` for warnings that should only be emitted once per reporter instance, such as deprecations or noisy environment notices.

> _Note: `warnOnce()` stores reported warning codes for the life of the reporter instance, so long-lived apps should call `clearWarnings()` at an appropriate lifecycle boundary if those cached codes should not be retained indefinitely._

```ts
// ✅ Logs the same code only once for this reporter instance
reporter.warnOnce("ERR02", { componentName: "MyComponent" });
reporter.warnOnce("ERR02", { componentName: "MyComponent" });

// ✅ Logs again after the warnOnce() cache is cleared
reporter.clearWarnings();
reporter.warnOnce("ERR02", { componentName: "MyComponent" });
```

## API Reference

### `createReporter(messages, options?: RuntimeReporterOptions): RuntimeReporter`

Takes a strict record of message templates and an optional set of configuration parameters, returning a reporter instance.

### `RuntimeReporter`

| Method              | Type                                                       | Description                                                                                                                                                                                                                                                                                     |
| :------------------ | :--------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`clearWarnings`** | `() => void`                                               | Clears the current reporter instance's internal `warnOnce()` cache so previously deduplicated warning codes can be emitted again.                                                                                                                                                               |
| **`error`**         | `(code: string, tokens?: RuntimeReporterTokens) => void`   | Logs using `console.error` **only if** the provided code template is available in the current environment's `messages` registry.                                                                                                                                                                |
| **`fail`**          | `(code: string, tokens?: RuntimeReporterTokens) => never`  | Throws a runtime `new Error(formattedMessage)` in **all** environments. Falls back safely to `defaultTemplate` if the template is not present (e.g., in Production builds).                                                                                                                     |
| **`log`**           | `(code: string, tokens?: RuntimeReporterTokens) => void`   | Logs using `console.log` **only if** the provided code template is available in the current environment's `messages` registry.                                                                                                                                                                  |
| **`message`**       | `(code: string, tokens?: RuntimeReporterTokens) => string` | Compiles and returns the resolved and formatted message without outputting side effects.                                                                                                                                                                                                        |
| **`warn`**          | `(code: string, tokens?: RuntimeReporterTokens) => void`   | Logs using `console.warn` **only if** the provided code template is available in the current environment's `messages` registry.                                                                                                                                                                 |
| **`warnOnce`**      | `(code: string, tokens?: RuntimeReporterTokens) => void`   | Logs using `console.warn` only the first time that code is reported by the current reporter instance, and only if the code exists in the current environment's `messages` registry. For long-lived reporter instances, call `clearWarnings()` when appropriate to release cached warning codes. |

### `RuntimeReporterOptions`

| Property              | Type                                              | Required | Description                                                                                                                                                          |
| :-------------------- | :------------------------------------------------ | :------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`defaultTemplate`** | `string`                                          | No       | Fallback copy applied when an unmatched error code is parsed. Defaults to `"An error occurred"`. Essential for `fail()` error-masking safely in production.          |
| **`formatMessage`**   | `(message: string, code: string) => string`       | No       | Overrides the final presentation string pattern. Defaults to: `"<message> (<code>)"`. _This option does not alter the string sent to the `onReport` telemetry hook._ |
| **`onReport`**        | `(payload: RuntimeReporterReportPayload) => void` | No       | A global hook executed whenever an action triggers via `.error()`, `.warn()`, `.warnOnce()`, `.log()`, or `.fail()`.                                                 |

### `RuntimeReporterTokens`

| Property | Type                   | Description                                                                                                                                     |
| :------- | :--------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| `string` | `RuntimeReporterToken` | A strict dynamic template mapping payload. Supported token primitives include: `string`, `number`, `boolean`, `Error`, `null`, and `undefined`. |

### `RuntimeReporterMessages`

A helper structural dictionary record type evaluated by `createReporter`.

```ts
type RuntimeReporterMessages = Record<string, string>;
```

### `RuntimeReporterReportPayload`

| Property  | Type                                   | Description                                                                                                                |
| :-------- | :------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| `code`    | `string`                               | The unique code key identifier bound to the event.                                                                         |
| `level`   | `"error" \| "warn" \| "log" \| "fail"` | The severity level of the report.                                                                                          |
| `message` | `string`                               | The parsed text message containing replaced tokens, prior to being processed by any custom global `formatMessage` filters. |

## Advanced Recipes

### Production-Grade Inconspicuous UI Logging

By utilizing the combined layers of `formatMessage` and `onReport`, you can completely obscure log readouts exposed to users on standard client screens, while ensuring engineers still catch the context-rich debug parameters behind the scenes on your analytical dashboard.

```ts
const reporter = createReporter(messages, {
    formatMessage: (message, code) => {
        return process.env.NODE_ENV === "production"
            ? "An unexpected system variation occurred. Reference diagnostics code key."
            : `${message} (${code})`;
    },
    onReport: (payload) => {
        if (process.env.NODE_ENV === "production") {
            navigator.sendBeacon("/api/telemetry", JSON.stringify(payload));
        }
    },
});
```

### Type-Safe Integration in Pure Vanilla JavaScript

You don't need a TypeScript compiler build step to benefit from literal token completion. You can utilize a JSDoc block to enforce a read-only variable template structure:

```js
const messages = /** @type {const} */ ({
    ERR01: "Something went wrong",
    ERR02: "{{ componentName }} failed to mount",
});

const reporter = createReporter(messages);
```

### Legacy CommonJS Environments

If your environment requires vintage CommonJS modules, fallback bindings are available out of the box:

```js
const { createReporter } = require("runtime-reporter");
```
