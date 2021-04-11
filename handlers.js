const fetch = require('node-fetch');
const sharp = require("sharp");
const { resolve } = require("path");
const fs = require("fs");
const URL = require("url").URL;
const mkdirp = require("mkdirp");

const imageNameMap = require("./image-name-map.json");
let imageBeingProcessed = false;

// https://stackoverflow.com/a/55585593/12108012
const isValidUrl = (s) => {
    try {
        new URL(s);
        return true;
    } catch (err) {
        return false;
    }
};

const smallestDivisibleByK = (startNum, k) => {
    if (startNum % k == 0) {
        return startNum;
    } else {
        return smallestDivisibleByK(startNum + 1, k);
    }
};

const splitDimensions = (w, h, wSplits, hSplits) => {
    const divisibleW = smallestDivisibleByK(w, wSplits);
    const divisibleH = smallestDivisibleByK(h, hSplits);

    const splitW = divisibleW / wSplits;
    const splitH = divisibleH / hSplits;

    return [splitW, splitH];
};

const getImageFilePath = (imageName, totalX, totalY, x, y, extension = 'jpg') => {
    return resolve(`./images/${imageName}-${totalX}-${totalY}/${imageName}-${x}-${y}.${extension}`);
};

const getImageFolderPath = (imageName, totalX, totalY) => {
    return resolve(`./images/${imageName}-${totalX}-${totalY}`);
};

const getOriginalImageStoragePath = (imageName) => {
    return resolve(`./images/${imageName}`);
};

const splitImage = async (image, imageName, wSplits, hSplits) => {
    imageBeingProcessed = true;

    const imageInfo = await image.metadata();
    const w = smallestDivisibleByK(imageInfo.width, wSplits);
    const h = smallestDivisibleByK(imageInfo.height, hSplits);
    image.resize({ width: w, height: h });

    const [splitW, splitH] = splitDimensions(w, h, wSplits, hSplits);
    
    for (let x = 0; x < wSplits; x++) {
        for (let y = 0; y < hSplits; y++) {
            const cropFromX = splitW * x;
            const cropFromY = splitH * y;

            console.log(`writing ${x} x ${y}`);

            const imageFolderPath = getImageFolderPath(imageName, wSplits, hSplits);
            await mkdirp(imageFolderPath);

            const imageFilePath = getImageFilePath(imageName, wSplits, hSplits, x + 1, y + 1)
            await image
                .clone()
                .extract({ left: cropFromX, top: cropFromY, width: splitW, height: splitH })
                .toFile(imageFilePath);
        }
    }

    imageBeingProcessed = false;
};

const imageExists = async (imageName, totalX, totalY) => {
    const imageFolderName = getImageFolderPath(imageName, totalX, totalY);
    try {
        await fs.promises.access(imageFolderName);
        return true;
    } catch (error) {
        return false;
    }
};

const handleImage = async (req, res) => {
    const imageName = req.params.imageName;

    if (!(imageName in imageNameMap)) {
        res.sendStatus(404);
        return;
    }

    const imageLocation = imageNameMap[imageName];
    const totalX = Number(req.params.totalX);
    const totalY = Number(req.params.totalY);
    const x = Number(req.params.x);
    const y = Number(req.params.y);

    if (x > totalX || y > totalY) {
        res.sendStatus(404);
        return;
    }

    // Block subsequent requests
    while (imageBeingProcessed) {}
    
    if (!(await imageExists(imageName, totalX, totalY))) {
        // If it's a link, download the image
        if (isValidUrl(imageLocation)) {
            const imageBuffer = await fetch(imageLocation).then(res => res.buffer());
            await fs.promises.writeFile(getOriginalImageStoragePath(imageName), imageBuffer);
        }
        
        const image = sharp(getOriginalImageStoragePath(imageName));
        await splitImage(image, imageName, totalX, totalY);
    }

    const imageFilename = getImageFilePath(imageName, totalX, totalY, x, y);
    console.log({ imageName, imageLocation, totalX, totalY, x, y, imageFilename });

    res.sendFile(imageFilename);
};

const handleVideo = async (req, res) => {
    // const videoName = req.params.videoName;
    // const totalX = Number(req.params.totalX);
    // const totalY = Number(req.params.totalY);
    // const x = Number(req.params.x);
    // const y = Number(req.params.y);
    // res.sendFile(videoName);
    res.sendStatus(200);
};

const handleRedirect = (req, res) => {
    const ngrok = req.params.ngrok;
    const rest = req.params[0];
    const redirectUrl = `http://${ngrok}.ngrok.io/${rest}`;
    res.redirect(redirectUrl);
}

module.exports = {
    handleImage,
    handleVideo,
    handleRedirect
};
