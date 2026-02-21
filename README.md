# Runtime Reporter

Runtime messaging that is convenient in development and secure in production.

## Features

- **Production friendly**: Pass an empty message set in production to avoid exposing internal messaging.
- **Centralized messages**: Define message text once; reference by code everywhere.
- **Tokenized templates**: Apply runtime data to messages via templated strings and tokenized variables.
- **Type-safe**: Autocomplete and compile-time validation for message codes and token names.
- **Tree-shakeable**: Pass an empty message set in production to reduce your bundle size
- **Test friendly**: Use `message()` to assert on final output without duplicating message text.
- **Dual module output**: Works with both ESM and CJS consumers.
- **Code-based messaging**: Coded messages make it easy can find errors and perform debugging tasks.

## Installation

```bash
npm install runtime-reporter
```

## Usage

### 1) Define your messages

Define the message “schema” (code + template + tokens), then create a `messages` record keyed by the codes.

```ts
import type { RuntimeReporterMessages } from "runtime-reporter";

type RuntimeMessages = Array<
    | {
          code: "ERR01";
          template: "{{ componentName }} failed to mount";
          tokens: ["componentName"];
      }
    | {
          code: "INFO01";
          template: "Ready";
          tokens?: undefined;
      }
>;

const messages: RuntimeReporterMessages<RuntimeMessages> = {
    ERR01: "{{ componentName }} failed to mount",
    INFO01: "Ready",
};
```

### 2) Create the reporter

Create a reporter instance. In production builds, you can pass an empty object so template strings don’t get logged (and can be removed by bundlers when guarded by an env check).

```ts
import { createRuntimeReporter } from "runtime-reporter";

export const reporter = createRuntimeReporter(
    process.env.NODE_ENV !== "production" ? messages : ({} as typeof messages)
);
```

### 3) Use the reporter

Call the various reporter methods wherever you need them. Pass them the code of the desired message along with any required tokens.

```ts
reporter.error("ERR01", { componentName: "MyComponent" });
// logs: "MyComponent failed to mount (ERR01)"

reporter.message("INFO01");
// returns: "Ready (INFO01)"
```

## API

### `createRuntimeReporter(RuntimeReporterMessages, options?: RuntimeReporterOptions): RuntimeReporter`

Takes a list of messages, an optional set of configuration options, and returns a reporter object.

### `RuntimeReporter`

| Property | Type                                                       | Description                                                                                                                             |
| -------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| message  | `(code: string, tokens:? RuntimeReporterTokens) => string` | Returns the resolved message (no logging); useful for testing environments.                                                             |
| warn     | `(code: string, tokens:? RuntimeReporterTokens) => void`   | Logs via `console.warn` **only if** the template exists in `messages`.                                                                  |
| error    | `(code: string, tokens:? RuntimeReporterTokens) => void`   | Logs via `console.error` **only if** the template exists in `messages`.                                                                 |
| log      | `(code: string, tokens:? RuntimeReporterTokens) => void`   | Logs via `console.log` **only if** the template exists in `messages`.                                                                   |
| fail     | `(code: string, tokens:? RuntimeReporterTokens) => never`  | Throws `new Error(resolvedMessage)` in **all** environments. Uses the `defaultTemplate` when the template does not exist in `messages`. |

### `RuntimeReporterOptions`

| Property        | Type                                        | Required | Description                                                                                                                                                                                      |
| --------------- | ------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| formatMessage   | `(message: string, code: string) => string` | No       | Customize the final output of every message. By default, messages are in the format: `"<message> (<code>)"`.                                                                                     |
| defaultTemplate | `string`                                    | No       | Fallback message text used when the code does not exist in `messages`. Defaults to `"An error occurred"`. This is mostly relevant for `fail()` in production when you pass an empty message set. |

### `RuntimeReporterTokens`

| Property | Type                   | Description                                                                                                                 |
| -------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `string` | `RuntimeReporterToken` | A record of token names along with their replacement value. Supported types include: `string`, `number`, `boolean`, `Error` |

## Examples

### Custom formatting

```ts
const reporter = createRuntimeReporter(messages, {
    formatMessage: (msg, code) => `[${code}] ${msg}`,
});

reporter.message("INFO01");
// "[INFO01] Ready"
```

### Using `message()` in tests

`message()` returns the resolved string without side effects, allowing you to validate precise messaging without duplicating test.

```ts
import { describe, it, expect, vi } from "vitest";
import { reporter } from "./reporter";

describe("reporter messages", () => {
    it("consoles error ERR01 correctly", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        reporter.error("ERR01", { componentName: "Widget" });

        expect(console.error).toHaveBeenCalledWidth(
            reporter.message("ERR01", { componentName: "Widget" })
        );
    });
});
```

### CommonJS support

If needed, Common JS imports are also available.

```js
// CJS
const { createRuntimeReporter } = require("runtime-reporter");
```
