
explore alternate user-interface to products

- webview deno provides cross-platform web UI, generally like any modern web browser
  https://deno.land/x/webview

- uses UXP and included v8/JavaScript runtime to interface with Photoshop
  https://developer.adobe.com/photoshop/uxp/
  https://github.com/AdobeDocs/uxp-photoshop-plugin-samples

While this currently passes instruction messages over a websocket it could potentially use the foreign function interface from Deno to apps that provide one.

