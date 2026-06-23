import { defineConfig, type Options } from "tsup";

const defaultConfig = {
    dts: true,
    clean: true,
    minify: true,
    sourcemap: false,
    external: [
        ...Object.keys(require("./package.json").dependencies || {}),
        ...Object.keys(require("./package.json").peerDependencies || {}),
        ...Object.keys(require("./package.json").optionalDependencies || {}),
        "fs", "path", "url", "bun"
    ],
} satisfies Options;

export default defineConfig([{
    ...defaultConfig,
    entry: ["src"],
    format: ["esm", "cjs"],
    outDir: "dist"
}]);
