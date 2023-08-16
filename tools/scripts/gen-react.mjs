// *******************************************************************************************************
// This script is to generate a React Component that imports all the modules in the dist folder.
// Importing it, and console.log the result
// Usage: node tools/scripts/gen-react.mjs
// *******************************************************************************************************

import { exit } from 'process';
import { writeFile, getFiles, greenLog, listDirsRecursive, yellowLog } from './utils.mjs';
import {
  GEN_STYLE,
  GEN_FOOTER_SCRIPTS,
  getConsoleTemplate,
} from './gen-utils.mjs';
import fs from 'fs';

// ------ Config ------
const TARGET_DIR = 'apps/react/src/app/';
const TARGET_FILE = 'app.tsx';
const REACT_FILE = TARGET_DIR + TARGET_FILE;
const DIST_DIR = 'dist/packages/';
const globalVarPrefix = 'LitJsSdk_';
const LAST_UPDATED = new Date().toUTCString();
const banner = `(REACT) THIS FILE IS AUTOMATICALLY GENERATED FROM tools/scripts/gen-react.mjs ${LAST_UPDATED}`;

const TEMPLATE = {
  HEADER: ``,
  BODY: '',
  FOOTER: ``,
};

// --
const modules = (await listDirsRecursive(DIST_DIR, false))
  .filter((dir) => !dir.includes('vanilla'))
  .map((dir) => {
    // replace hyphen with camel case
    const moduleName = dir
      .split('/')
      .pop()
      .replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    return {
      moduleName,
      dir,
    };
  });

// -- import * as LitJsSdk_litNodeClient from 'dist/packages/lit-node-client';
const importTags = modules.map(
  (mod) => `import * as ${globalVarPrefix}${mod.moduleName} from '${mod.dir}';`
);
// console.log("importTags:", importTags);

// declare global {
//   interface Window {
//     LitJsSdk_litNodeClient: any;
//     LitJsSdk_x: any;
//     LitJsSdk_y: any;
//     LitJsSdk_z: any;
//   }
// }
const getDeclareGlobalTemplate = (modules) => {
  return `declare global {
  interface Window {
    ${modules}
  }
}`;
};

const declareGlobal = getDeclareGlobalTemplate(
  modules
    .map((mod) => `${globalVarPrefix}${mod.moduleName}: any;`)
    .join('\n    ')
);

const getBodyTemplate = (
  _useEffectBody = '// FILL THIS UP!',
  _returnBody = '// RETURN BODY'
) => {
  return `export function App() {
    const loadedRef = useRef(false);

    useEffect(() => {
        if (loadedRef.current) return;
        loadedRef.current = true;

        ${_useEffectBody}
    });

    return (
        <>
            <style
                dangerouslySetInnerHTML={{
                    __html: \`
                    ${GEN_STYLE}
                    \`,
                }}
            />
            ${_returnBody}
            <div id="root"></div>
             <pre><code id="result"></code></pre>
        </>
    )
};`;
};

const consoleLogs = modules
  .map((mod, i) => {
    // read the package.json from dir
    const packageJson = fs.readFileSync(mod.dir + '/package.json', 'utf8');
    
    const json = JSON.parse(packageJson);

    // -- if buildOptions.genReact is false, skip
    if(json?.buildOptions?.genReact === false){
      yellowLog(`Skipping "${mod.moduleName}" because buildOptions.genReact is false`)
      return
    }

    return getConsoleTemplate(
      globalVarPrefix + mod.moduleName,
      i,
      globalVarPrefix,
      true
    );
  })
  .join('\n');

// --- Append to HEADER
TEMPLATE.HEADER += '// @ts-nocheck \n';
TEMPLATE.HEADER += `import { useEffect, useRef } from 'react';`;
TEMPLATE.HEADER += '\n\n';
TEMPLATE.HEADER += importTags.map((tag) => `${tag}`).join('\n');
TEMPLATE.HEADER += '\n\n';
TEMPLATE.HEADER += declareGlobal;
TEMPLATE.HEADER += '\n\n';

// --- Append to BODY
TEMPLATE.BODY += getBodyTemplate(
  `${consoleLogs}\n
    ${GEN_FOOTER_SCRIPTS.replace('<script>', '').replace('</script>', '')}`,
  `${banner}`
);

// -- Resemble everything
const CONTENT = TEMPLATE.HEADER + TEMPLATE.BODY + TEMPLATE.FOOTER;

await writeFile(REACT_FILE, CONTENT);

greenLog(`Updated ${REACT_FILE}`);
exit();
