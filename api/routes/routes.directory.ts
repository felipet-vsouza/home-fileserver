import * as express from 'express';
import * as Business from './../business';
import * as Middleware from './../middleware';
import { Response } from './../response';

export namespace DirectoryRoutes {

    export function configureRoutes() {
        let router: express.Router = express.Router();
        router.get('/:directoryId?', (request: express.Request, response: express.Response) => {
            Middleware.AuthenticationMiddleware.authenticate(request, response, () => {
                Resources.getDirectory(request, response);
            });
        });
        router.post('/', (request: express.Request, response: express.Response) => {
            Middleware.AuthenticationMiddleware.authenticate(request, response, () => {
                Resources.createDirectory(request, response);
            });
        });
        router.delete('/:directoryId', (request: express.Request, response: express.Response) => {
            Middleware.AuthenticationMiddleware.authenticate(request, response, () => {
                Resources.deleteDirectory(request, response);
            });
        });
        return router;
    }

}

namespace Resources {

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
            .catch((error: string) => {
                Response.Utils.prepareResponse(response, Response.ErrorResponseBuilder.get()
                    .withMessage(error)
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
            .catch((error: string) => {
                Response.Utils.prepareResponse(response, Response.ErrorResponseBuilder.get()
                    .withMessage(error)
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
            .catch((error: string) => {
                Response.Utils.prepareResponse(response, Response.ErrorResponseBuilder.get()
                    .withMessage(error)
                    .build());
                response.end();
            });
    }

}