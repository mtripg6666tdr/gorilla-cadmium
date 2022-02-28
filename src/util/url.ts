import { base64 } from ".";

export function restoreOriginalUrl(path:string){
  const match = path.match(/^\/_x_session_x_\/(?<endm>[a-zA-Z0-9_\-=]+)(?<path>\/.*)$/);
  if(match){
    const domain = base64.decode(match.groups.endm);
    const url = domain + match.groups.path;
    return url;
  }else{
    return null;
  }
}

export function escapeUrl(path:string|URL){
  const url = typeof path === "string" ? new URL(path) : path;
  return `/_x_session_x_/${base64.encode(url.origin)}${url.pathname + url.search + url.hash}`;
}