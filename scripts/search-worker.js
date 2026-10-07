import {pipeline,env} from '@huggingface/transformers';
env.allowLocalModels=false;
env.backends.onnx.wasm.numThreads=1;
env.backends.onnx.wasm.proxy=false;
env.backends.onnx.wasm.wasmPaths={mjs:new URL('./vendor/ort/ort-wasm-simd-threaded.asyncify.mjs',import.meta.url).href,wasm:new URL('./vendor/ort/ort-wasm-simd-threaded.asyncify.wasm',import.meta.url).href};
let extractor;
self.onmessage=async({data})=>{
 try{
  if(data.type==='init'){
   extractor=await pipeline('feature-extraction',data.config.model,{revision:data.config.revision,dtype:data.config.dtype,device:'wasm',progress_callback:p=>self.postMessage({type:'progress',status:p.status,file:p.file,progress:p.progress})});
   self.postMessage({type:'ready'});
  }else if(data.type==='query'){
   if(!extractor)throw Error('Model not ready');
   const output=await extractor('query: '+data.query,{pooling:'mean',normalize:true,truncation:true,max_length:256});
   self.postMessage({type:'result',requestId:data.requestId,query:data.query,vector:Array.from(output.data)});
  }
 }catch(error){self.postMessage({type:'error',requestId:data.requestId,message:String(error.message).slice(0,300)});}
};
