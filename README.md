# Runtime Reporter

Replace ad-hoc logging with structured, code-based messaging.

Runtime Reporter provides centralized, type-safe reporting that is convenient in development and secure in production.

```ts
// ./src/my-reporter.ts

import { createReporter } from "runtime-reporter";

export const reporter = createReporter({
    ERR01: "Something went wrong",
});

// ./src/MyComponent.ts

import { reporter } from "./my-reporter";

export function MyComponent() {
    useEffect(() => {
        reporter.error("ERR01");
    }, []);
}
```

## Why?

Runtime Reporter solves these problems:

- duplicated log messages
- inconsistent error wording
- fragile test assertions
- accidental exposure of sensitive data

by introducing these features:

- centralized and standardized error messaging
- stable error codes for debugging and error tracking
- test assertions without string duplication
- safer production output (no sensitive data exposure)

in a lightweight, self-contained package (less than 1 KB gzipped).

## Who is this for?

- Front-end frameworks and libraries
- Projects that need stable error codes
- Teams replacing custom logging systems
- Projects that want safer production output

## Installation

```bash
npm install runtime-reporter
```

## Quick start

A full, copy-and-paste example of how to use Runtime Reporter in your project:

```ts
import { createReporter, type RuntimeReporterMessages } from "runtime-reporter";

const messages: RuntimeReporterMessages<
    | {
          code: "ERR01";
          template: "{{ componentName }} failed to mount";
          tokens: "componentName";
      }
    | {
          code: "ERR02";
          template: "Failed to load configuration";
      }
    | {
          code: "ERR03";
          template: "Failed to fetch {{ resource }} from {{ url }}";
          tokens: "resource" | "url";
      }
> = {
    ERR01: "{{ componentName }} failed to mount",
    ERR02: "Failed to load configuration",
    ERR03: "Failed to fetch {{ resource }} from {{ url }}",
};

/** The runtime reporter for <project-name> */
const reporter = createReporter(messages);

export default reporter;
```

## Features

If you are new to Runtime Reporter, take a moment to explore its core features.

### 1. Code-based messaging

Replace inline strings with centralized, code-based identifiers.

```ts
// Without runtime-reporter
console.log("Something went wrong");
// ❌ Logs: "Something went wrong"

// With runtime-reporter
reporter.log("ERR01");
// ✅ Logs: "Something went wrong (ERR01)"
```

### 2. Dynamic messages

Inject runtime data into your messages via message templates and tokenized variables.

```ts
const reporter = createReporter({
    ERR01: "{{ componentName }} failed to mount",
});

reporter.error("ERR01", { componentName: "MyComponent" });
// ✅ Logs: "MyComponent failed to mount (ERR01)"
```

### 3. Development vs. production

Pass an empty object to the `createReporter` function in production environments for better security and a smaller bundle size.

```ts
const reporter = createReporter(
    process.env.NODE_ENV === "production" ? ({} as typeof messages) : messages
);
```

Development environments get detailed messaging, while production environments get as little as possible.

```ts
reporter.error("ERR01");
// ✅ In development, it logs: "Something went wrong (ERR01)"
// ✅ In production, it does not log

reporter.fail("ERR01");
// ✅ In development, it throws: "Something went wrong (ERR01)"
// ✅ In production, it throws: "An error occurred (ERR01)"
```

### 4. Type safety

Annotate your messages to get autocomplete and compile-time validation for message codes and token names.

```ts
const messages: RuntimeReporterMessages<{
    code: "ERR01";
    template: "{{ componentName }} failed to mount";
    tokens: "componentName";
}> = {
    // ✅ Autocomplete
    ERR01: "{{ componentName }} failed to mount",
};

const reporter = createReporter(messages);

// ✅ Autocomplete
reporter.error("ERR01", { componentName: "MyComponent" });

// ❌ TypeScript Error: "ERR02" is not a valid message code
reporter.error("ERR02", { componentName: "MyComponent" });

// ❌ TypeScript Error: "componentName" token is required
reporter.error("ERR01");
```

### 5. Test friendly

Assert against resolved messages without duplicating message text in your test environment.

```ts
it("should log error if component fails to mount", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(<MyComponent />);

    expect(console.error).toHaveBeenCalledWith(
        reporter.message("ERR01", { componentName: "MyComponent" })
        // ✅ Asserts: "MyComponent failed to mount (ERR01)"
    );
});
```

### 6. Custom side effects

Leverage the `onReport` hook to perform custom actions (e.g., logging to remote services) when a report is made.

```ts
const reporter = createReporter(messages, {
    onReport: (payload) => {
        fetch("/api/reports", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },
});

reporter.error("ERR01");
// ✅ Sends a POST request with the following payload:
// {
//     code: "ERR01",
//     message: "MyComponent failed to mount (ERR01)",
//     level: "error",
// }
```

## API

### `createReporter(RuntimeReporterMessages, options?: RuntimeReporterOptions): RuntimeReporter`

Takes a messages object, an optional set of configuration options, and returns a reporter object.

### `RuntimeReporter`

| Method  | Type                                                       | Description                                                                                                                             |
| ------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| message | `(code: string, tokens:? RuntimeReporterTokens) => string` | Returns the resolved message (no logging); useful for testing environments.                                                             |
| warn    | `(code: string, tokens:? RuntimeReporterTokens) => void`   | Logs via `console.warn` **only if** the template exists in `messages`.                                                                  |
| error   | `(code: string, tokens:? RuntimeReporterTokens) => void`   | Logs via `console.error` **only if** the template exists in `messages`.                                                                 |
| log     | `(code: string, tokens:? RuntimeReporterTokens) => void`   | Logs via `console.log` **only if** the template exists in `messages`.                                                                   |
| fail    | `(code: string, tokens:? RuntimeReporterTokens) => never`  | Throws `new Error(resolvedMessage)` in **all** environments. Uses the `defaultTemplate` when the template does not exist in `messages`. |

### `RuntimeReporterOptions`

| Property        | Type                                              | Required | Description                                                                                                                                                                                      |
| --------------- | ------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| formatMessage   | `(message: string, code: string) => string`       | No       | Customize the final output of every message. By default, messages are in the format: `"<message> (<code>)"`.                                                                                     |
| defaultTemplate | `string`                                          | No       | Fallback message text used when the code does not exist in `messages`. Defaults to `"An error occurred"`. This is mostly relevant for `fail()` in production when you pass an empty message set. |
| onReport        | `(payload: RuntimeReporterReportPayload) => void` | No       | A hook to perform custom actions when a report is made via `error`, `warn`, `log`, or `fail`.                                                                                                    |

### `RuntimeReporterTokens`

| Property | Type                   | Description                                                                                                                  |
| -------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `string` | `RuntimeReporterToken` | A record of token names along with their replacement value. Supported types include: `string`, `number`, `boolean`, `Error`. |

### `RuntimeReporterReportPayload`

| Property  | Type                                   | Description                                                                           |
| --------- | -------------------------------------- | ------------------------------------------------------------------------------------- |
| `code`    | `string`                               | The unique code associated with the message.                                          |
| `message` | `string`                               | The resolved message text; the placeholders have been replaced by their token values. |
| `level`   | `"error" \| "warn" \| "log" \| "fail"` | The severity level of the report.                                                     |

## Examples

### Custom formatting

You can customize the format of the message by providing a custom `formatMessage` function.

```ts
const reporter = createReporter(messages, {
    formatMessage: (message, code) => `[${code}] ${message}`,
});

reporter.message("ERR01", { componentName: "MyComponent" });
// "[ERR01] MyComponent failed to mount"
```

### Calling `fail()` in production

When the `createReporter` function provided an empty message set in production, the `fail` method will use the customizable `defaultTemplate` option which defaults to "An error occurred". This message is intended to be generic so that it does not reveal sensitive information about the system, while still providing a code for debugging purposes.

```ts
const reporter = createReporter(
    process.env.NODE_ENV === "production" ? ({} as typeof messages) : messages
);

reporter.fail("ERR01");
// throws: "An error occurred (ERR01)"
```

### Using `message()` in tests

The `message` method returns the resolved string without side effects, allowing you to validate precise messaging without duplicating text.

```ts
it("should log error if component fails to mount", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(<MyComponent />);

    expect(console.error).toHaveBeenCalledWith(
        reporter.message("ERR01", { componentName: "MyComponent" })
    );
});
```

### Using `onReport` and `formatMessage` together

By combining the `onReport` and `formatMessage` options, you can have granular control over the message output and reporting behavior. For example, you could log a generic message to users while still sending the full payload to a remote service in production environments. At the same time, you can log the full message in non-production environments for debugging purposes.

```ts
const reporter = createReporter(messages, {
    formatMessage: (message, code) => {
        if (process.env.NODE_ENV === "production") {
            return "Generic error message ...";
        } else {
            return `${message} (${code})`;
        }
    },
    onReport: (payload) => {
        if (process.env.NODE_ENV === "production") {
            fetch("/api/reports", {
                method: "POST",
                body: JSON.stringify(payload),
            });
        }
    },
});

reporter.error("ERR01");
// ✅ In production, users get a generic message AND remote service gets the full message
// ✅ In non-production, developers get the full message
```

### Type safety without TypeScript

You can still get the same benefits as TypeScript by using JSDoc-style type annotations.

```js
/**
 * @type {import("runtime-reporter").RuntimeReporterMessages<{
 *     code: "ERR01";
 *     template: "{{ componentName }} failed to mount";
 *     tokens: "componentName";
 * } | {
 *     code: "ERR02";
 *     template: "Failed to load configuration";
 * } | {
 *     code: "ERR03";
 *     template: "Failed to fetch {{ resource }} from {{ url }}";
 *     tokens: "resource" | "url";
 * }>}
 */
const messages = {
    ERR01: "{{ componentName }} failed to mount",
    ERR02: "Failed to load configuration",
    ERR03: "Failed to fetch {{ resource }} from {{ url }}",
};
```

### CommonJS support

If needed, Common JS imports are also available.

```js
const { createReporter } = require("runtime-reporter");
```
