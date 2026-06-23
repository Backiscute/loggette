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
         * Log at this level. Accepts a template literal — interpolated values are highlighted.
         * @example
         * logger.info`Connected to ${host}:${port}`
         */
        return (base: TemplateStringsArray, ...parts: string[]) => {
            if (LogLevel.indexOf(l) > LogLevel.indexOf(level)) return () => {};
            
            let str = `${shouldUseColor() ? Colors.date : ""}${new Date().toISOString()}${Colors.reset} ${shouldUseColor() ? Colors[l] : ""}${l.toUpperCase().padEnd(5, " ")}:${Colors.reset} `;

            for (let i = 0; i < base.length; i++) {
                str += base[i];
                if (i < parts.length) str += `${shouldUseColor() ? Colors[l] : ""}${String(parts[i])}${Colors.reset}`;
            };
            
            console[l](str);
            return logger;
        };
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

export default defaultLogger