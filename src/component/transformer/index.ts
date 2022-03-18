import internal, { Transform, TransformCallback } from "stream";
import encodingj from "encoding-japanese";
import { transformHtml } from "./module/html";
import { transformStyle } from "./module/style";
import { transformJson } from "./module/json";

export class ProxyTransformer extends Transform {
  private lineBuffer = "";
  private encoding = null as encodingj.Encoding;
  private readonly transformerFn = null as (line:string, baseUrl:string)=>string;

  constructor(private readonly mime:string, private readonly baseUrl:string, opts?:internal.TransformOptions){
    super({
      autoDestroy: true,
      ...opts
    });
    mime = mime.toLowerCase();

    if(mime.includes("text/html"))
      this.transformerFn = transformHtml;
    else if(mime.includes("text/css"))
      this.transformerFn = transformStyle;
    else if(mime.includes("application/json"))
      this.transformerFn = transformJson;
    else
      this.transformerFn = line => line;
    
    if(mime.includes("shift_jis"))
      this.encoding = "SJIS";
  }

  override _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback): void {
    if(["text/html", "javascript", "text/css", "application/json"].some(mime => this.mime.includes(mime))){
      const lines = (this.encoding ? Buffer.from(encodingj.convert(chunk, "UTF8", this.encoding)).toString() : chunk.toString()).split("\n") as string[];
      lines[0] = this.lineBuffer + lines[0];
      this.lineBuffer = lines.pop();
      let output = "";
      lines.forEach(line => {
        output += this.transformerFn(line, this.baseUrl) + "\n";
      });
      this.push(output);
    }else{
      this.push(chunk);
    }
    callback();
  }

  override _final(callback: (error?: Error) => void): void {
      this.push(this.transformerFn(this.lineBuffer, this.baseUrl));
      callback();
  }
}