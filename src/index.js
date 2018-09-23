import fs from 'fs';
import path from 'path';
import express from 'express';
import urlJoin from 'url-join';
import mimeTypes from '../mime-types.json';

const INDEX_FILE = 'index';
const HTML_FILE_EXTENSION = 'html';
const WEB_ROOT = '/';

const getMimeType = (extension) => {
    return mimeTypes[extension] || mimeTypes.text;
};

const addRoute = (location, rootPath, file, fileTypes, routesList) => {
    const filePath = path.join(rootPath, file),
          fileStat = fs.lstatSync(filePath);
          
    if(fileStat.isFile()) {
        const {ext, name} = path.parse(file);
        const fileType = fileTypes.find(fileType => fileType.extension.toLowerCase() === ext.slice(1).toLowerCase());
        if(fileType) {
            const webRoute = name === INDEX_FILE ? location : urlJoin(location, name),
                  route = {file: filePath, location: webRoute, mimeType: getMimeType(fileType.extension)};

            if(fileType.handler) route.handler = fileType.handler;
            if(fileType.header) route.header = fileType.header;

            routesList.push(route);
        }
    }
    else if(fileStat.isDirectory()) {
        const subLocation = urlJoin(location, file);
        getFiles(subLocation, filePath, fileTypes, routesList);
    }
};

const getFiles = (location, rootPath, fileTypes, routesList) => {
    fs.readdirSync(rootPath).forEach((file) => {
        addRoute(location, rootPath, file, fileTypes, routesList);
    });
};

const getRouteList = (location, webDir, fileTypes) => {
    const routes = [];
    getFiles(location, webDir, fileTypes, routes);
    return routes;
};

const generateRoutes = (location, webDir, fileTypes, router) => {
    getRouteList(location, webDir, fileTypes).forEach((route) => {
        const handler = route.handler ? 
            (req, res, next) => {
                route.handler(req, res, route.file);
            }
        : 
            (req, res, next) => {
                res.sendFile(route.file);
            }
        ;

        const handlerWithHeaders = (req, res, next) => {
            if(route.headers) {
                res.set = route.headers;
            }
            if(!res.get('Content-Type')) {
                res.set('Content-Type', route.mimeType);
            }
            handler(req, res, next);
        };

        router.route(route.location).get(handlerWithHeaders);
    });
};

const pageNotFoundError = ((message) => {
    return (req, res, next) => {
        const err = new Error(message);
        err.status = 404;
        next(err);
    };
});

const fileServeMiddleware = (webDir, fileTypes=[{extension: HTML_FILE_EXTENSION}]) => {
    // Create new router
    const router = express.Router();
    
    // Get all html files in this dir and all sub dirs and create a route for each. eg /docs/about.html --> /docs/about/ or /docs/about
    generateRoutes(WEB_ROOT, webDir, fileTypes, router); 

    // Serve all files in this dir and all sub dirs as static files
    router.use(WEB_ROOT, [express.static(webDir), pageNotFoundError('Not Found')]);

    // Return router with generated routes
    return router;
};

export default fileServeMiddleware;
