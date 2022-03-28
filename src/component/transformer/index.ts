import encodingj from "encoding-japanese";
import { transformHtml } from "./module/html";
import { transformStyle } from "./module/style";
import { transformJson } from "./module/json";

export function ProxyTransform(content:Buffer, baseUrl:string, mime:string){
  if(!mime) return content;
  const transformer = (() => {
    if(mime.includes("text/html")) return transformHtml;
    else if(mime.includes("text/css")) return transformStyle;
    else if(mime.includes("application/json")) return transformJson;
    else return null;
  })();
  const encoding = (() => {
    if(mime.includes("shift_jis")) return "SJIS";
    else return null;
  })() as encodingj.Encoding;
  if(transformer){
    const text = (encoding ? Buffer.from(encodingj.convert(content, "UTF8", encoding)).toString() : content.toString());
    return transformer(text, baseUrl);
  }else{
    return content;
  }
}