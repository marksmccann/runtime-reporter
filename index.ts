/**
 * The type information for a single runtime reporter message
 * @since v0.1.0
 */
export type RuntimeReporterMessage = {
    code: string;
    template: string;
    tokens?: string[];
};

/**
 * The type for a full list of messages with their associated code and template
 * @since v0.1.0
 */
export type RuntimeReporterMessages<T extends RuntimeReporterMessage[]> = {
    [K in T[number]["code"]]: Extract<T[number], { code: K }>["template"];
};

/**
 * The type for the supported values of a placeholder token
 * @since v0.1.0
 */
export type RuntimeReporterToken = string | number | boolean | Error | null | undefined;

/**
 * A utility type used to determine the second argument of the runtime reporter methods
 * @private
 */
type RuntimeReporterTokensArgs<
    T extends RuntimeReporterMessages<RuntimeReporterMessage[]>,
    U extends keyof T,
> =
    T extends RuntimeReporterMessages<infer V extends RuntimeReporterMessage[]>
        ? Extract<V[number], { code: U }>["tokens"] extends infer Tokens
            ? Tokens extends readonly string[]
                ? [tokens: Record<Tokens[number], RuntimeReporterToken>]
                : []
            : []
        : never;

/**
 * The runtime report object with all of it's associated methods; the result
 * of the primary export: `createRuntimeReporter`
 * @private
 */
interface RuntimeReporter<T extends RuntimeReporterMessages<RuntimeReporterMessage[]>> {
    /**
     * Retrieves the full text of the targeted message
     *
     * _Tip: This method is particularly useful in the test environment; allowing you
     * to make precise assertions without having to duplicate an of the raw message text._
     * @param code A direct reference to the unique code for the targeted message
     * @param args The remaining optional argument for the function; a record containing the placeholder token values
     */
    message<U extends Extract<keyof T, string>>(
        code: U,
        ...args: RuntimeReporterTokensArgs<T, U>
    ): string;

    /**
     * Logs a warning to the console with the full text of the targeted message in non-production environments
     *
     * _Note: This method will only log when the message associated with the code is found;
     * meaning it will not be called in production if the `createRuntimeReporter` function
     * is provided an empty array._
     * @param code A direct reference to the unique code for the targeted message
     * @param args The remaining optional argument for the function; a record containing the placeholder token values
     */
    warn<U extends Extract<keyof T, string>>(
        code: U,
        ...args: RuntimeReporterTokensArgs<T, U>
    ): void;

    /**
     * Logs an error to the console with the full text of the targeted message in non-production environments
     *
     * _Note: This method will only log when the message associated with the code is found;
     * meaning it will not be called in production if the `createRuntimeReporter` function
     * is provided an empty array._
     * @param code A direct reference to the unique code for the targeted message
     * @param args The remaining optional argument for the function; a record containing the placeholder token values
     */
    error<U extends Extract<keyof T, string>>(
        code: U,
        ...args: RuntimeReporterTokensArgs<T, U>
    ): void;

    /**
     * Logs a message to the console with the full text of the targeted message in non-production environments
     *
     * _Note: This method will only log when the message associated with the code is found;
     * meaning it will not be called in production if the `createRuntimeReporter` function
     * is provided an empty array._
     * @param code A direct reference to the unique code for the targeted message
     * @param args The remaining optional argument for the function; a record containing the placeholder token values
     */
    log<U extends Extract<keyof T, string>>(
        code: U,
        ...args: RuntimeReporterTokensArgs<T, U>
    ): void;

    /**
     * Throws an error with the full text of the targeted message in all environments
     *
     * _Note: When the `createRuntimeReporter` function is called in production with an empty
     * array, this method will use the "defaultTemplate" option in this format: "<defaultTemplate> (<code>)"_
     * @param code A direct reference to the unique code for the targeted message
     * @param args The remaining optional argument for the function; a record containing the placeholder token values
     */
    fail<U extends Extract<keyof T, string>>(
        code: U,
        ...args: RuntimeReporterTokensArgs<T, U>
    ): void;
}

export interface RuntimeReporterOptions {
    /**
     * A hook to format the message text univerally. By default, it
     * outputs the message in the following format: "<message> (<code>)"
     * @param message The resolved message text; the placeholders have been replaced by their token values
     * @param code The unique code associated with the message
     * @returns The final, fully formatted message
     */
    formatMessage?: (message: string, code: string) => string;

    /**
     * The default template to fallback on when a provided code does not
     * have an associated message. Defaults to "An error occurred"
     *
     * _Note: This is only used when the `fail` method is called in production
     * environments when the `createRuntimeReporter` function is provided an empty array._
     */
    defaultTemplate?: string;
}

/**
 * Resolves the message text via the message template and the associated tokens
 * @param template The template string for the reported message
 * @param tokens The token names and values for the instance
 * @returns The resolved message text; returns an empty string if the template is falsy
 */
const resolveTemplate = function resolveTemplate(
    template: string,
    tokens?: Record<string, RuntimeReporterToken>
): string {
    let message = template;

    if (message) {
        Object.entries(tokens || {}).forEach((entry) => {
            const [token, value] = entry;
            const replace = value instanceof Error ? value.message : String(value ?? "");
            const santized = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            message = message.replace(new RegExp(`\\{\\{\\s*${santized}\\s*\\}\\}`, "g"), replace);
        });
    }

    return message;
};

/**
 * Creates a reporter object with various helpful runtime methods
 * @param messages The messages record organized by code and template
 * @param options Optional configuration options
 * @returns A runtime report object
 */
export function createRuntimeReporter<T extends RuntimeReporterMessages<RuntimeReporterMessage[]>>(
    messages: T,
    options: RuntimeReporterOptions = {}
): RuntimeReporter<T> {
    const {
        formatMessage = (message, code) => `${message} (${code})`,
        defaultTemplate = "An error occurred",
    } = options;

    /**
     * Retrieves the final message for a give code and its associated tokens
     * @param code The unique code associated with the message
     * @param args The remaining optional argument for the function; a record containing the placeholder token values
     * @returns The fully resolve message or an empty string if there was no template
     */
    const getMessage = function getMessage(
        code: string,
        ...args: Array<Record<string, RuntimeReporterToken>>
    ): string {
        const template = messages[code] || defaultTemplate;
        const tokens = args[0];
        const text = resolveTemplate(template, tokens);
        return formatMessage(text, code);
    };

    return {
        message: (code, ...args) => {
            return getMessage(code, ...args);
        },
        error: (code, ...args) => {
            const message = getMessage(code, ...args);
            if (messages[code]) console.error(message);
        },
        warn: (code, ...args) => {
            const message = getMessage(code, ...args);
            if (messages[code]) console.warn(message);
        },
        log: (code, ...args) => {
            const message = getMessage(code, ...args);
            if (messages[code]) console.log(message);
        },
        fail: (code, ...args) => {
            const message = getMessage(code, ...args);
            throw new Error(message);
        },
    };
}
