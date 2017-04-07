import * as http from 'http';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import { Configuration } from './config/config.api';
import { IncomingForm, File, Files, Fields } from 'formidable';
import { join } from 'path';
import { Database } from './server.database';
import { Response } from './response/response';

import * as Business from './business/business';

export namespace ServerCore {

    let application: express.Express = express();
    let config: Configuration.IConfiguration = require('./config/config.json');

    export async function createServer(): Promise<http.Server> {
        return new Promise<http.Server>((resolve: Function, reject: Function) => {
            application.use(bodyParser.json());
            application.use('/api', Environment.configureRoutes());
            return Database.connect()
                .then(() => {
                    return Business.DirectoryBiz.seedDatabase();
                })
                .then(() => {
                    resolve(http.createServer(application));
                })
                .catch(() => {
                    reject();
                });
        });
    }

    namespace Environment {

        export function configureRoutes(): express.Router {
            let router: express.Router = express.Router();
            router.get('/file/:fileId', (request: express.Request, response: express.Response) => {
                Resources.serveFile(request, response);
            });
            router.post('/file', (request: express.Request, response: express.Response) => {
                Resources.storeFile(request, response);
            });
            router.delete('/file/:fileId', (request: express.Request, response: express.Response) => {
                Resources.deleteFile(request, response);
            });
            router.get('/file/listall', (request: express.Request, response: express.Response) => {
                Resources.listAllFiles(request, response);
            });
            router.get('/directory/:directoryId?', (request: express.Request, response: express.Response) => {
                Resources.getDirectory(request, response);
            });
            router.post('/directory', (request: express.Request, response: express.Response) => {
                Resources.createDirectory(request, response);
            });
            router.delete('/directory/:directoryId', (request: express.Request, response: express.Response) => {
                Resources.deleteDirectory(request, response);
            });
            router.get('/directory/listall', (request: express.Request, response: express.Response) => {
                Resources.listAllDirectories(request, response);
            });
            return router;
        }

    }

    namespace Resources {

        export function serveFile(request: express.Request, response: express.Response) {
            if (!request || !request.params) {
                Response.Utils.prepareResponse(response, Response.ErrorResponseBuilder
                    .get()
                    .build());
                return response.end();
            }
            let fileId = request.params.fileId;
            Business.FileBiz.getFile(fileId)
                .then((file: any) => {
                    Response.Utils.prepareFileResponse(file.name, file.size, response);
                    Response.Utils.pipeReadStream(file.path, response);
                })
                .catch(() => {
                    Response.Utils.prepareResponse(response, Response.ErrorResponseBuilder
                        .get()
                        .withMessage('The requested file could not be found.')
                        .build());
                    response.end();
                });
        }

        export function storeFile(request: express.Request, response: express.Response) {
            if (!request || !request.body) {
                Response.Utils.prepareResponse(response, Response.ErrorResponseBuilder
                    .get()
                    .build());
                return response.end();
            }
            let form: IncomingForm = new IncomingForm();
            form.multiples = false;
            form.uploadDir = config.server.temporaryUploadPath;
            form.parse(request, (error: any, fields: Fields, files: Files) => {
                if (error) {
                    Response.Utils.prepareResponse(response, Response.ErrorResponseBuilder
                        .get()
                        .withMessage('This file could not be uploaded.')
                        .build());
                    return response.end();
                }
                Business.FileBiz.storeFile(files['commonFile'], fields, form.uploadDir)
                    .then((created: any) => {
                        Response.Utils.prepareResponse(response, Response.SuccessResponseBuilder
                            .get()
                            .withBody({
                                storedFile: created
                            })
                            .build());
                        response.end();
                    })
                    .catch((reason: any) => {
                        Response.Utils.prepareResponse(response, Response.ErrorResponseBuilder
                            .get()
                            .withMessage('This file could not be uploaded.')
                            .build());
                        return response.end();
                    });
            });
        }

        export function deleteFile(request: express.Request, response: express.Response) {
            if (!request || !request.params) {
                Response.Utils.prepareResponse(response, Response.ErrorResponseBuilder
                    .get()
                    .build());
                return response.end();
            }
            let fileId = request.params.fileId;
            Business.DirectoryBiz.removeDirectory(fileId)
                .then((file: any) => {
                    Response.Utils.prepareResponse(response, Response.SuccessResponseBuilder.get()
                        .withBody({
                            removedFile: file
                        })
                        .build());
                    response.end();
                })
                .catch((error: NodeJS.ErrnoException) => {
                    Response.Utils.prepareResponse(response, Response.ErrorResponseBuilder.get()
                        .withMessage(`There was an error removing this file.`)
                        .build());
                    response.end();
                });
        }

        export function getDirectory(request: express.Request, response: express.Response) {
            if (!request || !request.params) {
                Response.Utils.prepareResponse(response, Response.ErrorResponseBuilder
                    .get()
                    .build());
                return response.end();
            }
            let directoryId = request.params.directoryId;
            Business.DirectoryBiz.getDirectoryAndFiles(directoryId)
                .then((directoryAndFiles: any) => {
                    Response.Utils.prepareResponse(response, Response.SuccessResponseBuilder.get()
                        .withBody(directoryAndFiles)
                        .build());
                    response.end();
                })
                .catch((error: NodeJS.ErrnoException) => {
                    Response.Utils.prepareResponse(response, Response.ErrorResponseBuilder.get()
                        .withMessage(`There was an error aquiring the information to the following directory: ${directoryId} - ${error}`)
                        .build());
                    response.end();
                });
        }

        export function createDirectory(request: express.Request, response: express.Response) {
            if (!request || !request.body || !request.body.directory) {
                Response.Utils.prepareResponse(response, Response.ErrorResponseBuilder
                    .get()
                    .build());
                return response.end();
            }
            let directory = request.body.directory;
            Business.DirectoryBiz.createDirectory(directory)
                .then((directory: any) => {
                    Response.Utils.prepareResponse(response, Response.SuccessResponseBuilder.get()
                        .withBody({
                            createdDirectory: directory
                        })
                        .build());
                    response.end();
                })
                .catch((error: NodeJS.ErrnoException) => {
                    Response.Utils.prepareResponse(response, Response.ErrorResponseBuilder.get()
                        .withMessage(`There was an error creating the following directory: ${directory}`)
                        .build());
                    response.end();
                });
        }

        export function deleteDirectory(request: express.Request, response: express.Response) {
            if (!request || !request.params) {
                Response.Utils.prepareResponse(response, Response.ErrorResponseBuilder
                    .get()
                    .build());
                return response.end();
            }
            let directoryId = request.params.directoryId;
            Business.DirectoryBiz.removeDirectory(directoryId)
                .then((directory: any) => {
                    Response.Utils.prepareResponse(response, Response.SuccessResponseBuilder.get()
                        .withBody({
                            removedDirectory: directory
                        })
                        .build());
                    response.end();
                })
                .catch((error: NodeJS.ErrnoException) => {
                    Response.Utils.prepareResponse(response, Response.ErrorResponseBuilder.get()
                        .withMessage(`There was an error removing this directory.`)
                        .build());
                    response.end();
                });
        }

        export function listAllFiles(request: express.Request, response: express.Response) {
            Business.FileBiz.findAllFiles()
                .then((files: any[]) => {
                    Response.Utils.prepareResponse(response, Response.SuccessResponseBuilder.get()
                        .withBody({
                            files: files
                        })
                        .build());
                    response.end();
                })
                .catch((reason: any) => {
                    Response.Utils.prepareResponse(response, Response.ErrorResponseBuilder.get()
                        .withMessage('It was not possible to list all files.')
                        .build());
                    response.end();
                });
        }

        export function listAllDirectories(request: express.Request, response: express.Response) {
            Business.DirectoryBiz.findAllDirectories()
                .then((directories: any[]) => {
                    Response.Utils.prepareResponse(response, Response.SuccessResponseBuilder.get()
                        .withBody({
                            directories: directories
                        })
                        .build());
                    response.end();
                })
                .catch((reason: any) => {
                    Response.Utils.prepareResponse(response, Response.ErrorResponseBuilder.get()
                        .withMessage('It was not possible to list all directories.')
                        .build());
                    response.end();
                });
        }
    }

}