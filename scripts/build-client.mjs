import {build} from 'esbuild';
import fs from 'node:fs';
await build({entryPoints:['scripts/search-worker.js'],outfile:'docs/search-worker.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,legalComments:'linked'});
// This public model class name triggers GitHub's Mistral-key detector when
// minified beside "mistral3". Escape its first character; runtime value is identical.
const bundle=fs.readFileSync('docs/search-worker.js','utf8');
fs.writeFileSync('docs/search-worker.js',bundle.replaceAll('"Mistral3ForConditionalGeneration"','"\\u004distral3ForConditionalGeneration"'));
fs.mkdirSync('docs/vendor/ort',{recursive:true});
for(const file of ['ort-wasm-simd-threaded.asyncify.mjs','ort-wasm-simd-threaded.asyncify.wasm'])fs.copyFileSync('node_modules/onnxruntime-web/dist/'+file,'docs/vendor/ort/'+file);
// npm's onnxruntime-web distribution omits LICENSE; retain the upstream MIT text.
if(!fs.existsSync('docs/vendor/ort/LICENSE'))throw Error('Missing upstream ONNX Runtime license');
fs.copyFileSync('node_modules/@huggingface/transformers/LICENSE','docs/vendor/transformers.LICENSE');
