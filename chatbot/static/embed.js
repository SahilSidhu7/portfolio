// chatbot/static/embed.js
//
// Loads the widget from whichever host served this file, rather than from a
// hardcoded one. The previous version pointed at pchat.webappster.store; when
// that domain expired the widget vanished from the site and the only clue was
// a blocked script in the browser console. Deriving the origin means moving
// the chatbot to a new hostname needs no change here at all.
(function () {
  const origin = new URL(document.currentScript.src).origin;
  const script = document.createElement("script");
  script.src = origin + "/static/widget.js?v=2";
  document.body.appendChild(script);
})();
