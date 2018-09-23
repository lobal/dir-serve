# Install
`npm install @lobal/dir-serve`

## Paramters

```js
import directoryServeMiddleware from '@lobal/dir-serve';

// extension[string]: file type to be converted to route.
// handler[function](optional): funtion to parse file before sending. If omitted the file will be sent as text with res.send(file).
// headers[object](optional): Additional headers to be sent with the file. content-type is automatically populated from mime-types.json, but can be overridden here.
const fileTypes = [
    {
        extension: 'html'
    },
    {
        extension: 'php', 
        handler: phpHandler
    },
    {
        extension: 'bobx', 
        handler: bobXHandler, 
        headers: {
            "content-type": "text/html;charset=UTF-8", 
        }
    }
];

// webDir[string]: directory to serve files from.
// fileTypes[array](optional): config options for each file type.
directoryServeMiddleware(webDir, fileTypes);
```

## Basic usage

```js
import express from 'express';
import path from 'path';
import directoryServeMiddleware from '@lobal/dir-serve';

const router = express.Router();
const webDir = path.join(__dirname, 'www');

// Supports HTML files by default.
// webDir: the directory you want to serve .
router.use('/', directoryServeMiddleware(webDir));
// ...
```

## Custom file types

```js
//...
// Custom handler for .php files
const myPhpParser = (req, res, file) => {
    const parsedFile = nodePhpParser.parse(file);
    res.sendFile(parsedFile);
};

const fileTypes = [
    {
        extension: 'html'
    },
    {
        extension: 'php', 
        handler: myPhpParser
    }
];

router.use('/', directoryServeMiddleware(webDir, fileTypes));
//...
```
