
const http2 = require('http2');
const fs = require('fs');
const mime = require('mime');
const path = require('path');


const options = {
//    key : fs.readFileSync(path.join(__dirname, '/server/server.key')),
//    cert: fs.readFileSync(path.join(__dirname, '/server/server.crt')),
    key : fs.readFileSync(path.join(__dirname, '/certs/privkey.pem')),
    cert: fs.readFileSync(path.join(__dirname, '/certs/fullchain.pem')),
    ca: fs.readFileSync(path.join(__dirname, '/certs/chain.pem')),
}

const h2server = http2.createSecureServer(options);
h2server.listen(3001);

// file push
function push(stream, reqPath) {
    const file = getFile(reqPath);
    if (!file) {
        //TODO File 이 없을 때의 처리
        console.log("file not found");
        return;
    }

    stream.pushStream({ ':path' : reqPath }, (err, pushStream) => {
        pushStream.respondWithFD(file.fd, file.headers);

        pushStream.once('error', (error) => {
            console.log('Push Error : ' + error.code);
        })
        pushStream.once('frameError', () => {
            console.log('Push Frame Error');
        })

        pushStream.once('close', () => {
            console.log("#pushStream close fd : " + file.fd + " " + file.path);
            fs.closeSync(file.fd)
        });
    });

}

h2server.on('stream', (stream, headers) => {
    const reqPath = headers[':path'] === '/' ? 'index.html' : headers[':path'];
    const file = getFile(reqPath);

    stream.session.state;
    if(reqPath === 'index.html') {

        // index.html을 전달하면서 필요한 자원들을 push합니다. 서버는 무엇을 클라이언트에 전달할지 알고 있어야합니다.
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
});

function getFile(reqPath) {
    try{
        const filePath = path.join(__dirname,  reqPath);

        const fd = fs.openSync(filePath, fs.constants.O_RDONLY);
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
