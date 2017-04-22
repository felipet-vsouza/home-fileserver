import * as express from 'express';
import { verify, JsonWebTokenError } from 'jsonwebtoken';
import { Configuration } from './../config/config.api';
import { Response } from './../response';

let config: Configuration.IConfiguration = require('./../config/config.json');

export namespace AuthenticationMiddleware {

    export function authenticate(request: express.Request, response: express.Response, next: Function) {
        let token = request.body.token || request.query.token || request.headers['x-access-token'];
        if (token) {
            verify(token, config.security.tokenSecret, function (error: JsonWebTokenError, decoded: any) {
                if (error) {
                    Response.Utils.prepareResponse(response, Response.ErrorResponseBuilder.get()
                        .withMessage('The authentication token is not valid.')
                        .withStatus(403)
                        .build());
                    response.end();
                } else {
                    next();
                }
            });
        } else {
            Response.Utils.prepareResponse(response, Response.ErrorResponseBuilder.get()
                .withMessage('You haven\'t been authenticated yet.')
                .withStatus(401)
                .build());
            response.end();
        }
    };
}