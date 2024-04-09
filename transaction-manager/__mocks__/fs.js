let fileBuffer = ''

function appendFile(path, data, callback) {
    fileBuffer += data;
    console.log(fileBuffer);
}

function getFileBuffer() {
    return fileBuffer;
}

function resetFileBuffer() {
    fileBuffer = '';
}

module.exports = { appendFile, getFileBuffer, resetFileBuffer };
