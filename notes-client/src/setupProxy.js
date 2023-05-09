const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
    app.use(
        createProxyMiddleware("/api/notes/socket", {
            target: "http://localhost:8080",
            changeOrigin: true,
            ws: true,
        })
    );

    app.use(
        "/auth",
        createProxyMiddleware({
            target: "http://localhost:8080",
        })
    );

    app.use(
        "/api",
        createProxyMiddleware({
            target: "http://localhost:8080",
            changeOrigin: true,
        })
    );
};
