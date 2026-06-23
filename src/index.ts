export const LogLevel = ["error", "warn", "info", "debug"] as const;
export type LogLevel = typeof LogLevel[number];

export const Colors: Record<LogLevel | "date" | "reset", string> = {
    info: "\x1b[32m",
    warn: "\x1b[33m",
    error: "\x1b[31m",
    debug: "\x1b[34m",
    date: "\x1b[90m",
    reset: "\x1b[0m"
};

/**
 * Creates a new logger instance.
 * @param level - Minimum level to print. Messages below this level are suppressed.
 * @param useColor - Force color on/off. If omitted, auto-detects from TTY/env vars.
*/
export function createLogger(level: LogLevel, useColor?: boolean) {
    function shouldUseColor(): boolean {
        if (useColor !== undefined) return useColor
        if (typeof process === "undefined") return true;

        if ("NO_COLOR" in process.env) return false;

        const force = process.env.FORCE_COLOR?.trim();
        if (force === "0") return false;
        if (force === "1") return true;

        return !!process.stdout?.isTTY;
    }

    const log = (l: LogLevel) => {
        /**
         * Log at this level.
         * Accepts:
         * - a template literal - interpolated values are highlighted.
         * - a string - no values are highlighted
         * @example
         * logger.info`Connected to ${"localhost"}:${5432}`
         * // the values "localhost" and "5432" are colored
         */
        function print(input: string | TemplateStringsArray, ...parts: any[]) {
            if (LogLevel.indexOf(l) > LogLevel.indexOf(level)) return () => {};
            
            let str = `${shouldUseColor() ? Colors.date : ""}${new Date().toISOString()}${Colors.reset} ${shouldUseColor() ? Colors[l] : ""}${l.toUpperCase().padEnd(5, " ")}:${Colors.reset} `;

            if (Array.isArray(input)) 
                for (let i = 0; i < input.length; i++) {
                    str += input[i];
                    if (i < parts.length) str += `${shouldUseColor() ? Colors[l] : ""}${String(parts[i])}${Colors.reset}`;
                }
            else str += input;
            
            console[l](str);
            return logger;
        };

        return print;
    };

    const logger = {
        ...LogLevel.reduce((v, l) => ({ ...v, [l]: log(l) }), {} as Record<LogLevel, ReturnType<typeof log>>),
        /**
         * Changes the log level.
         * @param lvl - Minimum level to print. Messages below this level are suppressed.
         */
        setLevel(lvl: LogLevel) { level = lvl; return logger; },
        /**
         * 
         * @param color - Force color on/off. If omitted, auto-detects from TTY/env vars. 
         */
        setUseColor(color?: boolean) { useColor = color; return logger; },
        /**
         * Sets the current logger as default in module-level.
         */
        setDefault: () => { defaultLogger = logger; return logger; },
        toString: () => `Loggette: ${level}, color ${shouldUseColor()}`,
        [Symbol.for("nodejs.util.inspect.custom")]: () => logger.toString()
    };

    return logger;
};

function getDefaultLevel(): LogLevel {
    const env = typeof process !== "undefined"
        ? process.env.LOG_LEVEL?.toLowerCase().trim()
        : undefined;

    if ((LogLevel as readonly string[]).includes(env ?? ""))
        return env as LogLevel;

    const nodeEnv = typeof process !== "undefined"
        ? process.env.NODE_ENV?.toLowerCase().trim()
        : undefined;

    switch (nodeEnv) {
        case "development": return "debug";
        case "test":        return "warn";
        case "production":  return "error";
        default:            return "info";
    }
}

let defaultLogger = createLogger(getDefaultLevel());

export type TemplateLiteral = [TemplateStringsArray, ...string[]];
/**
 * Template literal helper that returns the raw structure. Useful if you'd like to save a message with highlights to reuse later.
 *
 * @param base - The template strings array provided by the tagged template literal.
 * @param parts - Interpolated values inserted into the template.
 * @returns A tuple containing the original template strings and all interpolated parts.
 *
 * @example
 * const t = template`hello ${"world"}`;
 * // [["hello "], "world"]
 */
export const template = (base: TemplateStringsArray, ...parts: string[]) => [base, ...parts] as TemplateLiteral;

export default defaultLogger