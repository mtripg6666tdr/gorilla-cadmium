import * as http from "http";
import * as https from "https";
import { Readable } from "stream";
import * as zlib from "zlib";

const httpLibs = {
  "http:": http,
  "https:": https
} as {[key:string]:typeof http|typeof https};

function destructURL(url:URL){
  return {
    protocol: url.protocol,
    host: url.host,
    path: url.pathname + url.search + url.hash
  };
}

export function send(url:string, method:string = "GET", headers:{[key:string]:string}|http.IncomingHttpHeaders = {}, keepAlive:boolean = false){
  return new Promise<http.IncomingMessage>((resolve, reject) => {
    let durl = null as URL;
    try{
      durl = new URL(url);
    }
    catch(e){
      reject(e);
    }
    httpLibs[durl.protocol].request({
      ...destructURL(durl),
      method,
      headers,
      agent: keepAlive ? new httpLibs[durl.protocol].Agent({keepAlive: true}) : undefined
    }, (res) => {
      resolve(res);
    })
    .on("error", e => reject(e))
    .end();
  });
}

export function sendPost(url:string, data:http.IncomingMessage, headers:{[key:string]:string}|http.IncomingHttpHeaders = {}, keepAlive:boolean = false){
  return new Promise<http.IncomingMessage>((resolve, reject) => {
    let durl = null as URL;
    try{
      durl = new URL(url);
    }
    catch(e){
      reject(e);
    }
    data.pipe(
      httpLibs[durl.protocol].request({
        ...destructURL(durl),
        method: "POST",
        headers,
        agent: keepAlive ? new httpLibs[durl.protocol].Agent({keepAlive: true}) : undefined
      }, (res) => {
        resolve(res);
      })
    )
    .on("error", e => reject(e))
    ;
  });
}

export function decompressStream(reqres:http.IncomingMessage){
  if(!reqres.headers["content-encoding"]) return reqres;
  if(reqres.headers["content-encoding"] === "br"){
    return reqres.pipe(zlib.createBrotliDecompress())
  }else if(reqres.headers["content-encoding"] === "deflate"){
    return reqres.pipe(zlib.createDeflateRaw())
  }else if(reqres.headers["content-encoding"] === "gzip"){
    return reqres.pipe(zlib.createGunzip())
  }else{
    return reqres;
  }
}

export function resolveReadable(reqres:Readable){
  return new Promise<Buffer>((resolve, reject) => {
    let bufs = [] as Buffer[];
    reqres
      .on("data", (chunk) => bufs.push(chunk))
      .on("end", () => {
        resolve(Buffer.concat(bufs));
        bufs = null;
      })
      .on("error", (er) => reject(er))
    ;
  })
}