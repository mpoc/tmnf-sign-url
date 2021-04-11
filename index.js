const express = require('express');
const path = require('path');
// const pug = require("pug");

const handlers = require("./handlers.js");

const app = express();
const port = 9998;

// app.set("view engine", "pug");
// app.set("views", path.join(__dirname, "views"));

app.get("/i/:totalX/:totalY/:x/:y/:imageName", handlers.handleImage);
app.get("/v/:totalX/:totalY/:x/:y/:videoName", handlers.handleVideo);
app.get("/r/:ngrok/*", handlers.handleRedirect);

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
