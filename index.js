const express = require('express');
const path = require('path');
const pug = require("pug");

const handlers = require("./handlers.js");

const app = express();
const port = 3000;

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.get("/:x/:y/image.jpg", handlers.handleRequest);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
