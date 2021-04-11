const fetch = require('node-fetch');
const Jimp = require("jimp");
const { resolve } = require("path");
const fs = require("fs");

const imageNameMap = {};

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

const splitImage = async (image, imageName, wSplits, hSplits) => {
    const w = smallestDivisibleByK(image.bitmap.width, wSplits);
    const h = smallestDivisibleByK(image.bitmap.height, hSplits);
    await image.scaleToFit(w, h);

    const [splitW, splitH] = splitDimensions(w, h, wSplits, hSplits);
    
    // let croppedImages = Array(wSplits).fill(Array(hSplits));
    for (let x = 0; x < wSplits; x++) {
        for (let y = 0; y < hSplits; y++) {
            const cropFromX = splitW * x;
            const cropFromY = splitH * y;

            const clonedImage = await image.clone();
            await clonedImage.crop(cropFromX, cropFromY, splitW, splitH);
            console.log(`writing ${x} x ${y}`);
            // croppedImages[x][y] = await clonedImage.getBufferAsync(Jimp.AUTO);
            await clonedImage.writeAsync(getImageFilePath(imageName, wSplits, hSplits, x + 1, y + 1));
        }
    }
    // return croppedImages;
};

const imageExists = async (imageName, totalX, totalY) => {
    const imageFolderName = getImageFolderPath(imageName, totalX, totalY);
    try {
        await fs.promises.access(imageFolderName);
        console.log('exists');
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

    const jimpImageName = imageNameMap[imageName];
    const totalX = Number(req.params.totalX);
    const totalY = Number(req.params.totalY);
    const x = Number(req.params.x);
    const y = Number(req.params.y);

    if (x > totalX || y > totalY) {
        res.sendStatus(404);
        return;
    }
    
    if (!(await imageExists(imageName, totalX, totalY))) {
        const image = await Jimp.read(jimpImageName).catch((err) => { console.error(err) });
        await splitImage(image, imageName, totalX, totalY);
    }

    const imageFilename = getImageFilePath(imageName, totalX, totalY, x, y);
    console.log({ imageName, jimpImageName, totalX, totalY, x, y, imageFilename });

    res.sendFile(imageFilename);
};

const handleVideo = async (req, res) => {
    const videoName = req.params.videoName;
    const totalX = Number(req.params.totalX);
    const totalY = Number(req.params.totalY);
    const x = Number(req.params.x);
    const y = Number(req.params.y);
    // res.sendFile(videoName);
};

const handleRedirect = (req, res) => {
    const ngrok = req.params.ngrok;
    const rest = req.params.rest;
    const redirectUrl = `http://${ngrok}.ngrok.io/${rest}`;
    res.redirect(redirectUrl);
}

module.exports = {
    handleImage,
    handleVideo,
    handleRedirect
};
