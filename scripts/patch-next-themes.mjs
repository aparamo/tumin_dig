/**
 * React 19 / Next 16: next-themes 0.4.6 renders an inline <script> in a client component,
 * which triggers "Encountered a script tag while rendering..." (see pacocoursey/next-themes#385).
 * ThemeScript should only render on the server; useEffects apply theme on the client.
 * Aligns with community patch: render ThemeScript as null when typeof window !== "undefined".
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const patches = [
  {
    path: join(root, "node_modules/next-themes/dist/index.mjs"),
    from: '_=t.memo(({forcedTheme:e,storageKey:i,attribute:s,enableSystem:u,enableColorScheme:m,defaultTheme:a,value:l,themes:h,nonce:d,scriptProps:w})=>{let p=JSON.stringify([s,i,a,e,h,l,u,m]).slice(1,-1);return t.createElement("script",{...w,suppressHydrationWarning:!0,nonce:typeof window=="undefined"?d:"",dangerouslySetInnerHTML:{__html:`(${M.toString()})(${p})`}})})',
    to: '_=t.memo(({forcedTheme:e,storageKey:i,attribute:s,enableSystem:u,enableColorScheme:m,defaultTheme:a,value:l,themes:h,nonce:d,scriptProps:w})=>{if(typeof window!="undefined")return null;let p=JSON.stringify([s,i,a,e,h,l,u,m]).slice(1,-1);return t.createElement("script",{...w,suppressHydrationWarning:!0,nonce:d,dangerouslySetInnerHTML:{__html:`(${M.toString()})(${p})`}})})',
  },
  {
    path: join(root, "node_modules/next-themes/dist/index.js"),
    from: 'Y=t.memo(({forcedTheme:e,storageKey:s,attribute:n,enableSystem:l,enableColorScheme:o,defaultTheme:d,value:u,themes:h,nonce:m,scriptProps:w})=>{let p=JSON.stringify([n,s,d,e,h,u,l,o]).slice(1,-1);return t.createElement("script",{...w,suppressHydrationWarning:!0,nonce:typeof window=="undefined"?m:"",dangerouslySetInnerHTML:{__html:`(${I.toString()})(${p})`}})})',
    to: 'Y=t.memo(({forcedTheme:e,storageKey:s,attribute:n,enableSystem:l,enableColorScheme:o,defaultTheme:d,value:u,themes:h,nonce:m,scriptProps:w})=>{if(typeof window!="undefined")return null;let p=JSON.stringify([n,s,d,e,h,u,l,o]).slice(1,-1);return t.createElement("script",{...w,suppressHydrationWarning:!0,nonce:m,dangerouslySetInnerHTML:{__html:`(${I.toString()})(${p})`}})})',
  },
];

let applied = 0;
for (const { path, from, to } of patches) {
  if (!existsSync(path)) continue;
  let s = readFileSync(path, "utf8");
  if (s.includes(to)) continue;
  if (!s.includes(from)) {
    console.warn(`[patch-next-themes] Skipping ${path}: expected snippet not found (next-themes version changed?)`);
    continue;
  }
  s = s.replace(from, to);
  writeFileSync(path, s);
  applied++;
}
if (applied) console.log(`[patch-next-themes] Patched ${applied} file(s).`);
