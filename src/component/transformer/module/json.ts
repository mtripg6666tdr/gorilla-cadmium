import { urlUtil } from "../../../util";

export function transformJson(line:string, baseUrl:string){
  let result = line;
  try{
    const parsed = JSON.parse(result);
    return JSON.stringify(scanValues(parsed, data => {
      if(typeof data === "string"){
        try{
          if(!data.startsWith("http")) return data;
          const url = new URL(data, baseUrl);
          return urlUtil.escapeUrl(url);
        }
        catch{
          return data;
        }
      }else{
        return data;
      }
    }));
  }
  catch(e){
    return result;
  }
}

function scanValues<T>(obj:any, transformer:(d:T)=>T):any{
  if(obj === null || obj === undefined){
    return obj;
  }else if(typeof obj !== "object"){
    return transformer(obj);
  }else if(Array.isArray(obj)){
    for(let i = 0; i < obj.length; i++){
      obj[i] = scanValues(obj[i], transformer);
    }
    return obj;
  }else{
    const keys = (Object.keys(obj) as (keyof typeof obj)[]);
    for(let i = 0; i < keys.length; i++){
      console.log(obj[keys[i]], "(", keys[i], ")", "will be scanned")
      obj[keys[i]] = scanValues(obj[keys[i]], transformer);
    }
    return obj;
  }
}