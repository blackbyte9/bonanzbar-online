import {build} from 'esbuild';
import {mkdir,cp,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
await mkdir('dist',{recursive:true});await cp('public','dist',{recursive:true});
await build({entryPoints:['src/entry.tsx'],outfile:'dist/app.js',bundle:true,minify:true,platform:'browser',format:'esm',jsx:'automatic',alias:{'@':resolve('.')},define:{'process.env.NODE_ENV':'"production"'}});
await writeFile('dist/index.html','<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#171719"><meta name="referrer" content="no-referrer"><title>Bonanzbar Crew</title><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><noscript>Bitte JavaScript aktivieren.</noscript><script type="module" src="/app.js"></script></body></html>');
