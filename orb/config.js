// This file overwrites the stock UV config.js

self.__uv$config = {
  prefix: "/orb/ixl/",
  bare: "/bare/",
  encodeUrl: Ultraviolet.codec.base64.encode,
  decodeUrl: Ultraviolet.codec.base64.decode,
  handler: "/orb/handler.js",
  client: "/orb/client.js",
  bundle: "/orb/bundle.js",
  config: "/orb/config.js",
  sw: "/orb/fr.sw.js",
};
