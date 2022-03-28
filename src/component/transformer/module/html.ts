import { base64, urlUtil } from "../../../util";
import { transformStyle } from "./style";

export function transformHtml(line:string, baseUrl:string){
  const id = Math.floor(Date.now() * Math.random()).toString(20);
  let result = line;
  let regex = /(?<bfr><base[^>]+href=")(?<href>[^"]+)(?<aft>"[^>]*>)/i;
  if(result.match(regex)){
    baseUrl = new URL(result.match(regex).groups.href, baseUrl).href;
    result = result.replace(regex, val => {
      const match = val.match(regex);
      return `${match.groups.bfr}${urlUtil.escapeUrl(new URL(match.groups.href, baseUrl))}${match.groups.aft}`;
    });
  }
  regex = /(?<bfr0><.+?\s((href)|(src)|(action))=")(?<url0>.*?)(?<aft0>".*?>)|(?<bfr1><.+?((href)|(src)|(action))=')(?<url1>.*?)(?<aft1>'.*?>)|(?<bfr2><.+?((href)|(src)|(action))=)(?<url2>[^\s>]*?)(?<aft2>(\s.*?>)|>)/i;
  if(result.match(regex)){
    result = result.replace(new RegExp(regex, "g"), val => {
      const match = val.match(regex);
      const url = match.groups.url0 || match.groups.url1 || match.groups.url2 || "";
      if(url){
        if(url.startsWith("#")) return val;
        if(url.startsWith("data:")) return val;
      }else if(url === ""){
        return val;
      }
      return `${match.groups.bfr0 || match.groups.bfr1 || match.groups.bfr2}${urlUtil.escapeUrl(new URL(match.groups.url0 || match.groups.url1 || match.groups.url2, baseUrl))}${match.groups.aft0 || match.groups.aft1 || match.groups.aft2}`
    });
  }
  regex = /(?<bfr0><.+?srcset=")(?<url0>.*?)(?<aft0>".*?>)|(?<bfr1><.+?srcset=')(?<url1>.*?)(?<aft1>'.*?>)|(?<bfr2><.+?srcset=)(?<url2>[^\s>]*?)(?<aft2>(\s.*?>)|>)/i;
  if(result.match(regex)){
    result = result.replace(new RegExp(regex, "g"), val => {
      const match = val.match(regex);
      const converted = (match.groups.url0 || match.groups.url1 || match.groups.url2 || "").split(",").map(urlset => {
        const [url, scale] = urlset.split(" ");
        return `${urlUtil.escapeUrl(new URL(url, baseUrl))} ${scale}`;
      }).join(",");
      return `${match.groups.bfr0 || match.groups.bfr1 || match.groups.bfr2}${converted}${match.groups.aft0 || match.groups.aft1 || match.groups.aft2}`
    });
  }
  regex = /<html(\s.*?)?>/i;
  if(result.match(regex)){
    result = result.replace(regex, `$&\n<meta http-equiv="x-proxy" content="gorila-cadmium">\n<script src="/gc_module_inject.js?id=${encodeURIComponent(base64.encode(id))}" id="__v${id}__gc_inject_" data-original="${encodeURIComponent(baseUrl)}"></script>`);
  }
  regex = /integrity=".+?"/ig;
  if(result.match(regex)){
    result = result.replace(regex, "");
  }
  regex = /nonce=".+?"/g;
  if(result.match(regex)){
    result = result.replace(regex, "");
  }
  regex = /<\/body>/i;
  if(result.match(regex)){
    result = result.replace(regex, `<div id="box-${id}" style="position:fixed;z-index:9999999999;padding:0.5em;margin:0px;bottom:0px;left:0px;width:100%;box-sizing:border-box;background-color:white;border-top:1px solid black;border-radius:unset;"><span style="line-height:1.8em;">これはWebプロキシを使用しています。<a href="/">トップに戻る</a>/<a href="${baseUrl}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">オリジナルのページを開く</a></span><span style="position:absolute;top:0px;right:0.3em;font-size:140%;line-height:1em;cursor:pointer;display:block;" onclick="document.getElementById('box-${id}').style.display='none';">x</span></div>$&`)
  }
  result = transformStyle(result, baseUrl);
  regex = /(?<bfr><script[^>]*>)(?<scr>.*?)(?<aft><\/script>)/i;
  result = result.replace(new RegExp(regex, "g"), scriptBlock => {
    const match = scriptBlock.match(regex);
    let scr = match.groups.scr;
    scr = scr.replace(/["']https?:\/\/[\w\$\(\)~\.\+\-]+/ig, (url) => {
      try{
        const res = urlUtil.escapeUrl(url.substring(1)).slice(0, -1);
        return res;
      }
      catch{
        return url;
      }
    });
    return `${match.groups.bfr}${scr}${match.groups.aft}`;
  });
  return result;
}