import { urlUtil } from "../../../util";

export function transformStyle(line:string, baseUrl:string){
  let result = line;
  let regex = /(?<bfr>url\("?)(?<url>.+?)(?<aft>("?)\))/;
  if(result.match(regex)){
    result = result.replace(new RegExp(regex, "g"), val => {
      const match = val.match(regex);
      let url = match.groups.url;
      let ad = "";
      if(!url) return val;
      if(url[0] === "'") {
        url = url.substring(1).slice(0,-1);
        ad = "'";
      }
      if(url.startsWith("data:")) return val;
      return `${match.groups.bfr}${ad}${urlUtil.escapeUrl(new URL(url, baseUrl))}${ad}${match.groups.aft}`;
    });
  }
  return result;
}