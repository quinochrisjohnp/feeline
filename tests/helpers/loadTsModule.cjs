const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),ts=require("typescript");
module.exports=function loadTsModule(file,dependencies={}) {
  const filename=path.resolve(__dirname,"../..",file), exports={};
  const source=ts.transpileModule(fs.readFileSync(filename,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(source,{exports,console,Date,Promise,setTimeout,clearTimeout,require:id=>{
    if(id in dependencies)return dependencies[id];
    if(id.startsWith("."))return require(path.resolve(path.dirname(filename),id));
    return require(id);
  }},{filename});
  return exports;
};
