(function () {

    const container = document.createElement("div");
    container.id = "ai-chatbot-widget";

    container.style.position = "fixed";
    container.style.bottom = "20px";
    container.style.right = "20px";
    container.style.zIndex = "9999";

    document.body.appendChild(container);

    const script = document.createElement("script");
    script.src = "http://localhost:8000/static/chatbot.js";

    document.body.appendChild(script);

})();