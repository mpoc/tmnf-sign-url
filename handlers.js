const fetch = require('node-fetch');

const handleRequest = async (req, res) => {
    console.log(req.headers);
    // console.log(req.params);
    const imageUrl = "https://picsum.photos/280/140";
    const image = await fetch(imageUrl).then((response) => response.blob());

    // console.log(image);

    // res.render("index", { imgUrl: "https://picsum.photos/200" });

    res.type(image.type);
    image.arrayBuffer().then((buf) => {
        res.send(Buffer.from(buf));
    });
};

module.exports = {
    handleRequest
};
