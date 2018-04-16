

const http = require('http');
const https = require('https');
const http2 = require('http2');
const fs = require('fs');
const mime = require('mime');
const path = require('path');
// const mime = require('mime');

const options = {
//    key : fs.readFileSync(path.join(__dirname, '/server/server.key')),
//    cert: fs.readFileSync(path.join(__dirname, '/server/server.crt')),
    key : fs.readFileSync(path.join(__dirname, '/certs/privkey.pem')),
    cert: fs.readFileSync(path.join(__dirname, '/certs/fullchain.pem')),
    ca: fs.readFileSync(path.join(__dirname, '/certs/chain.pem')),

    allowHTTP1 : true,

    /*
    settings : {
        enablePush : true,
        headerTableSize :4096000,
        initialWindowSize : 65535000,
        maxFrameSize : 16384000,
        maxHeaderListSize : 65535000
    },*/
}

const h2server = http2.createSecureServer(options);
h2server.listen(3001);

h2server.on('frameError' , (err) => {
    console.log("frame error");
} )

h2server.on('error', (err) => {
    console.log('error');
})

h2server.on('stream', (stream, headers) => {
    const reqPath = headers[':path'] === '/' ? 'index.html' : headers[':path'];
    const file = getFile(reqPath);

    if(reqPath === 'index.html') {
//        console.log("index.html request");
        push(stream, '/app/lib/jquery.js');
        push(stream, '/app/lib/lodash.js');
        push(stream, '/app/lib/bootstrap.min.css');
        push(stream, '/app/lib/bootstrap.min.js');
    } else {
        console.log("another request");
    }

    if(!file) {
        stream.respond({':status' : 404});
        stream.end();
        return;
    }
    stream.respondWithFD(file.fd, file.headers);

    stream.once('close', () => {
        console.log("#stream close fd : " + file.fd + " " + file.path);
        fs.closeSync(file.fd)
    });

    stream.once('error', () => {
        console.log('error 1');
    })
    stream.once('frameError', () => {
        console.log('f error 1');
    })
   // stream.end();
});

h2server.on('error', () => {
    console.log("error");
})


function getFile(reqPath) {
    try{
        const filePath = path.join(__dirname,  reqPath);
//        console.log("try open file - " + filePath);
        const fd = fs.openSync(filePath, fs.constants.O_RDONLY);  // fs.constants.O_RDONLY == 0, 'r' 이랑 같은 의미니?
        const contentType = mime.getType(filePath);
        const stat = fs.statSync(filePath);
        return {
            fd : fd,
            path : reqPath,
            headers : {
                'content-type' : contentType,
                'content-length' : stat.size, //optional
                'last-modified' : stat.mtime.toUTCString(), //optional
            }
        }
    } catch(e) {
        console.log("error. cannot read file");
        return null;
    }

}
