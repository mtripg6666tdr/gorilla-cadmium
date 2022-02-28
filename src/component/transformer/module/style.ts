import { urlUtil } from "../../../util";

export function transformStyle(line:string, baseUrl:string){
  let result = line;
  let regex = /(?<bfr>url\("?)(?<url>.+?)(?<aft>("?)\))/;
  if(result.match(regex)){
    result = result.replace(new RegExp(regex, "g"), val => {
      const match = val.match(regex);
      const url = match.groups.url;
      if(!url) return val;
      if(url.startsWith("data:")) return val;
      return `${match.groups.bfr}${urlUtil.escapeUrl(new URL(url, baseUrl))}${match.groups.aft}`;
    });
  }
  return result;
}