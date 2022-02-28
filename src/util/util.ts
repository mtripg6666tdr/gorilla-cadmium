import { IncomingHttpHeaders } from "http";
import { urlUtil } from ".";

export function filterRequestHeaders(headers:IncomingHttpHeaders){
  const result = Object.assign({}, headers);
  if(result["host"]) delete result["host"];
  if(result["origin"]) delete result["origin"];
  if(result["referer"]) {
    const ref = new URL(result["referer"]);
    result["referer"] = urlUtil.restoreOriginalUrl(ref.pathname + ref.search + ref.hash);
  }
  return result;
}

export function filterResponseHeaders(headers:IncomingHttpHeaders, baseUrl:string){
  const result = Object.assign({}, headers);
  if(result["host"]) delete result["host"];
  if(result["location"]) {
    const ref = new URL(result["location"], baseUrl);
    result["location"] = urlUtil.escapeUrl(ref.href);
  }
  if(result["transfer-encoding"]) delete result["transfer-encoding"];
  if(result["connection"]) delete result["connection"];
  if(result["content-encoding"]) delete result["content-encoding"];
  if(result["content-length"]) delete result["content-length"];
  if(result["content-security-policy"]) delete result["content-security-policy"];
  if(result["set-cookie"]){
    for(let i = 0; i < result["set-cookie"].length; i++){
      result["set-cookie"][i] = result["set-cookie"][i]
        .replace(/domain=[^;]+;/gi, "")
        .replace(/\s\s/, " ")
        .replace(/path=(?<path>.+?);/, path => {
          return "path=" + urlUtil.escapeUrl(new URL(path.match(/path=(?<path>.+?);/).groups.path, baseUrl)) + ";";
        })
    }
  }
  if(result["content-type"]) result["content-type"] = result["content-type"].replace(/charset=.+$/, "charset=utf-8");
  return result;
}