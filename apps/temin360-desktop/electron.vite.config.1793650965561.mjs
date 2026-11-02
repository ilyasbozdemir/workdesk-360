// electron.vite.config.ts
import fs from "fs";
import path, { resolve } from "path";
import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import JavaScriptObfuscator from "javascript-obfuscator";
function controlledRendererObfuscator(shouldObfuscate) {
  if (!shouldObfuscate) return null;
  const obfuscatorOptions = {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: "hexadecimal",
    numbersToExpressions: false,
    renameGlobals: false,
    selfDefending: false,
    simplify: true,
    splitStrings: false,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: ["base64"],
    stringArrayThreshold: 0.8,
    rotateStringArray: true,
    transformObjectKeys: false,
    unicodeEscapeSequence: false,
    sourceMap: false
  };
  return {
    name: "vite-plugin-controlled-renderer-obfuscator",
    apply: "build",
    enforce: "post",
    async writeBundle(options, bundle) {
      const outDir = options.dir;
      if (!outDir) return;
      for (const fileName in bundle) {
        if (!fileName.endsWith(".js") && !fileName.endsWith(".mjs")) {
          continue;
        }
        const targetPath = path.resolve(outDir, fileName);
        if (!fs.existsSync(targetPath)) continue;
        try {
          const rawCode = fs.readFileSync(targetPath, "utf8");
          const obfuscated = JavaScriptObfuscator.obfuscate(rawCode, obfuscatorOptions);
          fs.writeFileSync(targetPath, obfuscated.getObfuscatedCode(), "utf8");
        } catch (error) {
          const msg = `[Obfuscator Kritik Hata] ${fileName} dosyas\u0131n\u0131n kar\u0131\u015Ft\u0131r\u0131lmas\u0131 ba\u015Far\u0131s\u0131z oldu!`;
          console.error(msg, error);
          throw new Error(
            `${msg} \xDCretim (production) g\xFCvenli\u011Fi i\xE7in kar\u0131\u015Ft\u0131r\u0131lmam\u0131\u015F JavaScript derlemesine izin verilmez. Hata detay\u0131: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    }
  };
}
var electron_vite_config_default = defineConfig(({ mode, command }) => {
  const edition = mode === "full" ? "full" : "dogrudan-temin";
  const define = { "import.meta.env.VITE_APP_EDITION": JSON.stringify(edition) };
  const isReleaseWorkflow = Boolean(process.env.BUILD_FOR_RELEASE) || Boolean(process.env.GITHUB_WORKFLOW) && /release/i.test(process.env.GITHUB_WORKFLOW || "");
  const isTestOrCI = process.env.NODE_ENV === "test" || Boolean(process.env.CI) && !isReleaseWorkflow || process.env.VITE_TEST === "true" || process.env.VITE_BYTECODE === "false";
  const isProduction = (command === "build" || process.env.NODE_ENV === "production") && !isTestOrCI;
  const obfuscator = controlledRendererObfuscator(isProduction);
  return {
    main: {
      define,
      build: {
        bytecode: !isTestOrCI,
        sourcemap: false,
        externalizeDeps: {
          exclude: ["@temin360/document-templates", "@worksuite-360/document-engine"]
        }
      }
    },
    preload: {
      define,
      build: {
        bytecode: !isTestOrCI,
        sourcemap: false
      }
    },
    renderer: {
      define,
      resolve: {
        alias: {
          "@renderer": resolve("src/renderer/src")
        }
      },
      build: {
        sourcemap: false
      },
      plugins: [react(), ...obfuscator ? [obfuscator] : []]
    }
  };
});
export {
  electron_vite_config_default as default
};
