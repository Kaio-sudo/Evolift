const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = __dirname;
const HOST = "0.0.0.0";
const PORT = Number(process.env.PORT) || 4173;
const PUBLIC_DIRECTORIES = new Set(["assets", "icons", "js", "styles"]);
const MIME_TYPES = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp"
};

function resolvePublicFile(requestUrl) {
    let pathname;
    try {
        pathname = decodeURIComponent(new URL(requestUrl, "http://localhost").pathname);
    } catch {
        return null;
    }

    const requestedPath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const filePath = path.resolve(ROOT, requestedPath);
    const relativePath = path.relative(ROOT, filePath);
    const parts = relativePath.split(path.sep);
    const allowedPath = relativePath === "index.html" ||
        (parts.length > 1 && PUBLIC_DIRECTORIES.has(parts[0]));

    if (
        !allowedPath ||
        relativePath.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relativePath) ||
        !MIME_TYPES[path.extname(filePath).toLowerCase()]
    ) {
        return null;
    }

    return filePath;
}

const server = http.createServer((request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405, { Allow: "GET, HEAD" });
        response.end();
        return;
    }

    const filePath = resolvePublicFile(request.url);
    if (!filePath) {
        response.writeHead(404);
        response.end("Not found");
        return;
    }

    fs.readFile(filePath, (error, contents) => {
        if (error) {
            response.writeHead(error.code === "ENOENT" || error.code === "EISDIR" ? 404 : 500);
            response.end(error.code === "ENOENT" || error.code === "EISDIR" ? "Not found" : "Unable to read file");
            if (response.statusCode === 500) console.error("Could not read requested file.", error);
            return;
        }

        response.writeHead(200, {
            "Cache-Control": "no-store",
            "Content-Length": contents.length,
            "Content-Type": MIME_TYPES[path.extname(filePath).toLowerCase()],
            "X-Content-Type-Options": "nosniff"
        });
        response.end(request.method === "HEAD" ? undefined : contents);
    });
});

server.on("error", (error) => {
    console.error(`Could not start the Evolift server on port ${PORT}.`, error);
    process.exitCode = 1;
});

server.listen(PORT, HOST, () => {
    console.log(`Evolift running on port ${PORT}.`);
    console.log(`On this computer: http://localhost:${PORT}`);

    const addresses = Object.values(os.networkInterfaces())
        .flat()
        .filter((network) => network && network.family === "IPv4" && !network.internal)
        .map((network) => network.address);

    if (addresses.length === 0) {
        console.log("No local network IPv4 address was found.");
        return;
    }

    addresses.forEach((address) => console.log(`On your phone: http://${address}:${PORT}`));
    console.log("Connect both devices to the same Wi-Fi network.");
});
