import {build} from 'esbuild';
import {resolve} from 'node:path';
import {rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const output=resolve('tests/render-sept28.built.mjs');
try{
 await build({entryPoints:['tests/render-sept28.tsx'],outfile:output,bundle:true,platform:'node',format:'esm',jsx:'automatic',alias:{'@':resolve('.')},external:['react','react-dom'],banner:{js:"import {createRequire} from 'node:module';const require=createRequire(import.meta.url);"},define:{'process.env.NODE_ENV':'"production"'}});
 const result=spawnSync(process.execPath,[output],{stdio:'inherit'});if(result.error)throw result.error;process.exitCode=result.status??1;
}finally{await rm(output,{force:true})}
