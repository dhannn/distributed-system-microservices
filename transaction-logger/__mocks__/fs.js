let fileBuffer = ''

function appendFile(path, data, callback) {
    fileBuffer += data;
    fileBuffer += '\n';
    console.log(fileBuffer);
}

function getFileBuffer() {
    return fileBuffer;
}

function resetFileBuffer() {
    fileBuffer = '';
}

module.exports = { appendFile, getFileBuffer, resetFileBuffer }
