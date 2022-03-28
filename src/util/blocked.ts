export function checkBlocked(url:string){
  return url.endsWith("yjsecure.js")
  || url.includes("error_204?")
  ;
}