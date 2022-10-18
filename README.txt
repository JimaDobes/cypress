
explore alternate user-interface to products

- webview deno provides cross-platform web UI, generally like any modern web browser
  https://deno.land/x/webview

- uses UXP and included v8/JavaScript runtime to interface with Photoshop
  https://developer.adobe.com/photoshop/uxp/
  https://github.com/AdobeDocs/uxp-photoshop-plugin-samples

While this currently passes instruction messages over a websocket it could potentially use the foreign function interface from Deno to apps that provide one.

setup (follow instructions at):
- install Deno 🦕 https://deno.land/
- zip contents of `ps` directory (manifest.json, etc)
  rename file changing .zip to .ccx
  open the ccx which should automatically install in Creative Cloud app
  alternately use UXP devtool to load/install/debug (docs linked above)

run (terminal command):
- deno run -A --unstable ./deno/app.js

use:
- connect the webview UI and UXP UI to the websocket (currently manual)
- messages from deno-webview relay to/from the UXP panel into Photoshop

