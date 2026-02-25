/**
 * The type information for a single runtime reporter message
 * @since v0.1.0
 */
export type RuntimeReporterMessage = {
    code: string;
    template: string;
    tokens?: string;
};

/**
 * The type for a full list of messages with their associated code and template
 * @since v0.1.0
 */
export type RuntimeReporterMessages<T extends RuntimeReporterMessage> = {
    [K in T["code"]]: Extract<T, { code: K }>["template"];
};

/**
 * The type for the supported values of a placeholder token
 * @since v0.1.0
 */
export type RuntimeReporterToken = string | number | boolean | Error | null | undefined;

/**
 * The type for a record of placeholder token names and their values
 * @since v0.2.0
 */
export type RuntimeReporterTokens = Record<string, RuntimeReporterToken>;

/**
 * A utility type used to determine the second argument of the runtime reporter methods
 * @private
 */
type ReporterTokensArgs<T extends RuntimeReporterMessage, U extends T["code"]> = Extract<
    T,
    { code: U }
>["tokens"] extends infer Tokens
    ? [Tokens] extends [string]
        ? [tokens: Record<Tokens, RuntimeReporterToken>]
        : []
    : [];

/**
 * Return type for message(); displays the template + code in default format on hover.
 * The runtime value is the resolved string (tokens substituted); the type is for DX only.
 * @private
 */
type MessageReturnType<T extends RuntimeReporterMessage, U extends T["code"]> =
    Extract<T, { code: U }> extends { template: infer Template }
        ? Template extends string
            ? `${Template} (${U})`
            : string
        : string;

/**
 * The runtime report object with all of it's associated methods;
 * the result of the primary export: `createReporter`
 * @private
 */
interface RuntimeReporter<T extends RuntimeReporterMessage> {
    /**
     * Retrieves the full text of the targeted message
     *
     * _Note: As a convenience, the return type will attempt to show the literal type of the template
     * pattern and code suffix (in the default format) for the message on hover; the actual output may
     * vary based on the tokens provided and the `formatMessage` option._
     *
     * _Tip: This method is particularly useful in the test environment; allowing you
     * to make precise assertions without having to duplicate any of the raw message text._
     * @param code A direct reference to the unique code for the targeted message
     * @param args The remaining optional argument for the function; a record containing the placeholder token values
     */
    message<U extends T["code"]>(
        code: U,
        ...args: ReporterTokensArgs<T, U>
    ): MessageReturnType<T, U>;

    /**
     * Logs a warning to the console with the full text of the targeted message in non-production environments
     *
     * _Note: This method will only log when the message associated with the code is found;
     * meaning it will not be called in production if the `createReporter` function
     * is provided an empty message set._
     * @param code A direct reference to the unique code for the targeted message
     * @param args The remaining optional argument for the function; a record containing the placeholder token values
     */
    warn<U extends T["code"]>(code: U, ...args: ReporterTokensArgs<T, U>): void;

    /**
     * Logs an error to the console with the full text of the targeted message in non-production environments
     *
     * _Note: This method will only log when the message associated with the code is found;
     * meaning it will not be called in production if the `createReporter` function
     * is provided an empty message set._
     * @param code A direct reference to the unique code for the targeted message
     * @param args The remaining optional argument for the function; a record containing the placeholder token values
     */
    error<U extends T["code"]>(code: U, ...args: ReporterTokensArgs<T, U>): void;

    /**
     * Logs a message to the console with the full text of the targeted message in non-production environments
     *
     * _Note: This method will only log when the message associated with the code is found;
     * meaning it will not be called in production if the `createReporter` function
     * is provided an empty message set._
     * @param code A direct reference to the unique code for the targeted message
     * @param args The remaining optional argument for the function; a record containing the placeholder token values
     */
    log<U extends T["code"]>(code: U, ...args: ReporterTokensArgs<T, U>): void;

    /**
     * Throws an error with the full text of the targeted message in all environments
     *
     * _Note: When the `createReporter` function is called in production with an empty
     * message set, this method will use the "defaultTemplate" option in this format: "&lt;defaultTemplate> (&lt;code>)"_
     * @param code A direct reference to the unique code for the targeted message
     * @param args The remaining optional argument for the function; a record containing the placeholder token values
     */
    fail<U extends T["code"]>(code: U, ...args: ReporterTokensArgs<T, U>): never;
}

/**
 * The configuration options for createReporter()
 * @since v0.1.0
 */
export interface RuntimeReporterOptions {
    /**
     * A hook to format the message text universally. By default, it
     * outputs the message in the following format: "&lt;message> (&lt;code>)"
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
     * environments when the `createReporter` function is provided an empty message set._
     */
    defaultTemplate?: string;
}

/**
 * Resolves the message text via the message template and the associated tokens
 * @param template The template string for the reported message
 * @param tokens The token names and values for the instance
 * @returns The resolved message text; returns an empty string if the template is falsy
 * @private
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
            const sanitized = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            message = message.replace(new RegExp(`\\{\\{\\s*${sanitized}\\s*\\}\\}`, "g"), replace);
        });
    }

    return message;
};

/**
 * Creates a new runtime reporter object with all of it's associated methods
 * @param messages The messages record organized by code and template
 * @param options Optional configuration options
 * @returns A runtime report object
 * @since v0.1.0
 */
export function createReporter<T extends RuntimeReporterMessage>(
    messages: RuntimeReporterMessages<T>,
    options: RuntimeReporterOptions = {}
): RuntimeReporter<T> {
    const {
        formatMessage = (message, code) => `${message} (${code})`,
        defaultTemplate = "An error occurred",
    } = options;
    const messagesByCode = messages as Record<string, string>;

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
        const template = messagesByCode[code] || defaultTemplate;
        const tokens = args[0];
        const text = resolveTemplate(template, tokens);
        return formatMessage(text, code);
    };

    return {
        message: (code, ...args) =>
            getMessage(code, ...args) as MessageReturnType<T, typeof code & T["code"]>,
        error: (code, ...args) => {
            const message = getMessage(code, ...args);
            if (messagesByCode[code]) console.error(message);
        },
        warn: (code, ...args) => {
            const message = getMessage(code, ...args);
            if (messagesByCode[code]) console.warn(message);
        },
        log: (code, ...args) => {
            const message = getMessage(code, ...args);
            if (messagesByCode[code]) console.log(message);
        },
        fail: (code, ...args) => {
            const message = getMessage(code, ...args);
            throw new Error(message);
        },
    };
}
