# Runtime Reporter

Structured runtime events for applications and frameworks. A composable foundation for logging, messaging, and runtime reporting.

## Features

- **Security focused**: Pass an empty message set in production to avoid exposing internal messaging.
- **Centralized messages**: Define message text once; reference by a unique code everywhere else.
- **Tokenized templates**: Apply runtime data to messages via templated strings and tokenized variables.
- **Type-safe**: Autocomplete and compile-time validation for message codes and token names.
- **Tree-shakeable**: Pass an empty message set in production to reduce your bundle size
- **Test friendly**: Use `message()` to assert on final output without duplicating message text.
- **Code-based messaging**: Coded messages make it easy to identify errors to perform debugging tasks.
- **Small footprint**: Minimal bundle size (~2 KB minified) so it adds negligible weight to your app.
- **Zero dependencies**: No runtime dependencies; the published package is fully self-contained.
- **Scalable pattern**: Can scale to fit your specific needs regardless of your project's size.

## Installation

```bash
npm install runtime-reporter
```

## Usage

### 1) Define your messages

Define the message “schema” (code + template + tokens), then create a `messages` record keyed by the codes.

```ts
import type { RuntimeReporterMessages } from "runtime-reporter";

type MyMessages =
    | {
          code: "ERR01";
          template: "{{ componentName }} failed to mount";
          tokens: ["componentName"];
      }
    | {
          code: "INFO01";
          template: "Ready";
          tokens?: undefined;
      };

const messages: RuntimeReporterMessages<MyMessages> = {
    ERR01: "{{ componentName }} failed to mount",
    INFO01: "Ready",
};
```

### 2) Create the reporter

Pass your messages to `createReporter()` to create a reporter instance.

```ts
import { createReporter } from "runtime-reporter";

export const reporter = createReporter(
    // Pass an empty object in production for better security and a smaller bundle size
    process.env.NODE_ENV === "production" ? ({} as typeof messages) : messages
);
```

### 3) Use the reporter

Call the various reporter methods wherever you need them.

```ts
reporter.error("ERR01", { componentName: "MyComponent" });
// logs: "MyComponent failed to mount (ERR01)"

reporter.message("INFO01");
// returns: "Ready (INFO01)"
```

## API

### `createReporter(RuntimeReporterMessages, options?: RuntimeReporterOptions): RuntimeReporter`

Takes a list of messages, an optional set of configuration options, and returns a reporter object.

### `RuntimeReporter`

| Method  | Type                                                       | Description                                                                                                                             |
| ------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| message | `(code: string, tokens:? RuntimeReporterTokens) => string` | Returns the resolved message (no logging); useful for testing environments.                                                             |
| warn    | `(code: string, tokens:? RuntimeReporterTokens) => void`   | Logs via `console.warn` **only if** the template exists in `messages`.                                                                  |
| error   | `(code: string, tokens:? RuntimeReporterTokens) => void`   | Logs via `console.error` **only if** the template exists in `messages`.                                                                 |
| log     | `(code: string, tokens:? RuntimeReporterTokens) => void`   | Logs via `console.log` **only if** the template exists in `messages`.                                                                   |
| fail    | `(code: string, tokens:? RuntimeReporterTokens) => never`  | Throws `new Error(resolvedMessage)` in **all** environments. Uses the `defaultTemplate` when the template does not exist in `messages`. |

### `RuntimeReporterOptions`

| Property        | Type                                        | Required | Description                                                                                                                                                                                      |
| --------------- | ------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| formatMessage   | `(message: string, code: string) => string` | No       | Customize the final output of every message. By default, messages are in the format: `"<message> (<code>)"`.                                                                                     |
| defaultTemplate | `string`                                    | No       | Fallback message text used when the code does not exist in `messages`. Defaults to `"An error occurred"`. This is mostly relevant for `fail()` in production when you pass an empty message set. |

### `RuntimeReporterTokens`

| Property | Type                   | Description                                                                                                                  |
| -------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `string` | `RuntimeReporterToken` | A record of token names along with their replacement value. Supported types include: `string`, `number`, `boolean`, `Error`. |

## Examples

### Custom formatting

You can customize the format of the message by providing a custom `formatMessage` function.

```ts
const reporter = createReporter(messages, {
    formatMessage: (msg, code) => `[${code}] ${msg}`,
});

reporter.message("INFO01");
// "[INFO01] Ready"
```

### Using `message()` in tests

The `message` method returns the resolved string without side effects, allowing you to validate precise messaging without duplicating text.

```ts
import { describe, it, expect, vi } from "vitest";
import { reporter } from "./reporter";

describe("reporter messages", () => {
    it("consoles error ERR01 correctly", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        reporter.error("ERR01", { componentName: "Widget" });

        expect(console.error).toHaveBeenCalledWith(
            reporter.message("ERR01", { componentName: "Widget" })
        );
    });
});
```

### CommonJS support

If needed, Common JS imports are also available.

```js
// CJS
const { createReporter } = require("runtime-reporter");
```
