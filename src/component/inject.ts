(function(){
  const prefix = "_x_session_x_";
  const generateUrl = (url:string)=>{
    if(url.startsWith("data:")) return url;
    if(url.startsWith("blob:")) return url;
    if(url.startsWith("about:")) return url;
    const durl = new URL(url);
    return `/_x_session_x_/${
        window.btoa(durl.origin)
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
      }${durl.pathname + durl.search + durl.hash}`;
  };
  const injectElem = document.getElementById("__gc_inject");
  if(!injectElem) return;
  const currentUrl = new URL(decodeURIComponent(injectElem.dataset.original));
  const proxify = (href:string) => {
    if(typeof href === "object") href = (href as any).toString();
    if(typeof href !== "string") {
      console.log("no proxfied:", href, "->", href);
      return href;
    }
    if(href.startsWith("/" + prefix) || href.startsWith(window.location.origin + "/" + prefix)){
      console.log("no proxfied:", href, "->", href);
      return href;
    }
    const result = generateUrl((()=>{
      if(href.startsWith(window.location.origin + "/") && !href.startsWith(window.location.origin + "/" + prefix)){
        return new URL(new URL(href).pathname, currentUrl).href;
      }else if(href.startsWith("/") && !href.startsWith("/" + prefix)){
        return new URL(href, currentUrl).href;
      }
      return new URL(href, currentUrl).href;
    })());
    console.log("proxfied:", href, "->", result);
    return result;
  };
  const fetch_orig = window.fetch;
  window.fetch = function(url:string|Request, options){
    if(typeof url === "string")
      url = proxify(url);
    else
      url = new Request(proxify(url.url), {
        ...url,
        method: url.method,
        referrer: proxify(url.referrer)
      });
    // @ts-ignore
    return fetch_orig.apply(this, arguments);
  } as typeof window.fetch;
  const xhrOpen_orig = window.XMLHttpRequest.prototype.open;
  window.XMLHttpRequest.prototype.open = function(method, url, async, user, password){
    url = proxify(typeof url === "string" ? url : url.href);
    // @ts-ignore
    return xhrOpen_orig.apply(this, arguments);
  } as typeof window.XMLHttpRequest.prototype.open;
  const formatElement = (element:Element) => {
    if (!element.tagName) return;
    if (
      element.tagName.toLowerCase() === 'script' 
      || element.tagName.toLowerCase() === 'iframe' 
      || element.tagName.toLowerCase() === 'embed'
      || element.tagName.toLowerCase() === 'img') {
      // @ts-ignore
      Object.defineProperty(element.__proto__, 'src', {
        set: function(value) {
            value = proxify(value);
            element.setAttribute('src', value);
        }
      }); 
    } else if (element.tagName.toLowerCase() === 'link') {
      // @ts-ignore
      Object.defineProperty(element.__proto__, 'href', {
        set: function(value) {
            value = proxify(value);
            element.setAttribute('href', value);
        }
      }); 
    } else if (element.tagName.toLowerCase() === 'form') {
      // @ts-ignore
      Object.defineProperty(element.__proto__, 'action', {
        set: function(value) {
            value = proxify(value);
            element.setAttribute('action', value);
        }
      }); 
    }
  };
  const createElement_orig = window.document.createElement; 
  window.document.createElement = function(tag:string, options:ElementCreationOptions) {
    const element = createElement_orig.call(document, tag, options);
    formatElement(element);
    return element;
  } as typeof window.document.createElement;
  window.Image = function(width?:number, height?:number){
    const img = document.createElement("img");
    if(width) img.width = width;
    if(height) img.height = height;
    return img;
  } as any;
  const appendChild_orig = window.document.appendChild;
  window.document.appendChild 
    = window.HTMLElement.prototype.appendChild
    = function(node){
    ["src", "href", "action"].forEach(attr => {
      // @ts-ignore
      if(node[attr]) node[attr] = proxify(node[attr]);
    });
    return appendChild_orig.apply(this, arguments);
  };
  const setAttribute_orig = window.Element.prototype.setAttribute; 
  window.Element.prototype.setAttribute = function(attribute, href) {
    if (attribute === 'src' || attribute === 'href' || attribute === 'action') {
      href = proxify(href);
    } else 
      href = href;
    return setAttribute_orig.apply(this, arguments);
  };
  const sendBeacon_orig = window.navigator.sendBeacon;
  window.navigator.sendBeacon = function(url, data){
    if(typeof url === "string")
      url = proxify(url);
    else
      url = new URL(proxify(url.href));
    return sendBeacon_orig.apply(this, arguments);
  };
  setInterval(function() {
    if (!window.location.pathname.startsWith(`/${prefix}/${window.btoa(currentUrl.origin)}`)) {
      history.replaceState('', '', `/${prefix}/${window.btoa(currentUrl.origin)}/${window.location.href.split('/').splice(3).join('/')}`);
    }
  }, 50);
})()