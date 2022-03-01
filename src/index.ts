import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { urlUtil, util, web } from "./util";
import { ProxyTransformer } from "./component/transformer";
import * as zlib from "zlib";

const indexPage = fs.readFileSync(path.join(__dirname, "../common/index.html"), {encoding:"utf-8"});
const injectScript = fs.readFileSync(path.join(__dirname, "./component/inject.js"), {encoding:"utf-8"});
const error404Page = fs.readFileSync(path.join(__dirname, "../common/404.html"), {encoding:"utf-8"});
const error500Page = fs.readFileSync(path.join(__dirname, "../common/500.html"), {encoding:"utf-8"});

http.createServer(async (req, res) => {
  if(req.url === "/"){
    res.writeHead(200, {
      "Content-Type": "text/html, charset=utf-8",
      "Cache-Control": "max-age=3600",
      "Content-Encoding": "gzip",
    });
    res.end(zlib.gzipSync(indexPage));
  }else if(req.url === "/gc_module_inject.js"){
    res.writeHead(200, {
      "Content-Type": "text/javascript",
      "Content-Encoding": "gzip",
    });
    res.end(zlib.gzipSync(injectScript));
  }else{
    const url = urlUtil.restoreOriginalUrl(req.url);
    if(url && !url.includes(req.headers["host"])){
      try{
        const keepAlive = req.headers["connection"] && req.headers["connection"].toString() === "keep-alive";
        const reqres = await (()=>{
          if(req.method.toLowerCase() === "post"){
            return web.sendPost(url, req, util.filterRequestHeaders(req.headers), keepAlive);
          }else{
            return web.send(url, req.method, util.filterRequestHeaders(req.headers), keepAlive);
          }
        })();
        res.writeHead(reqres.statusCode, {
          ...util.filterResponseHeaders(reqres.headers, url),
          "content-encoding": "gzip"
        });
        const reqresDecomp = reqres.statusCode === 304 ? reqres : web.decompressStream(reqres);
        const transform = new ProxyTransformer(reqres.headers["content-type"], url);
        const createGzip = zlib.createGzip();
        const onError = (e?:Error) => {
          if(!reqres.destroyed) reqres.destroy(e);
          if(!transform.destroyed) transform.destroy(e);
          if(!createGzip.destroyed) createGzip.destroy(e);
          if(!res.destroyed) res.destroy(e);
        };
        reqresDecomp
          .on("error", onError)
          .pipe(transform)
          .on("error", onError)
          .pipe(createGzip)
          .on("error", onError)
          .pipe(res)
          .on("error", onError)
        ;
      }
      catch(e){
        if(!res.headersSent) res.writeHead(500, {"Content-Type": "text/html, charset=UTF-8"});
        res.end(error500Page);
      }
    }else if(req.headers["referer"] && req.url !== "/"){
      const original = urlUtil.restoreOriginalUrl(new URL(req.headers["referer"]).pathname);
      if(!original) {
        if(!res.headersSent) res.writeHead(404);
        res.end();
        return;
      }
      const loc = urlUtil.escapeUrl(new URL(original).origin).slice(0, -1) + req.url
      res.writeHead(302, {"Location": loc});
      res.end();
    }else{
      if(!res.headersSent) res.writeHead(404, {"Content-Type": "text/html, charset=UTF-8"});
      res.end(error404Page);
    }
  }
})
  .listen(8080)
  .on("listening", () => console.log("Server started successfully"))
  ;