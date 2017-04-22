import { User, UserBuilder, UserDAO } from './../database/entity.user';
import { Configuration } from './../config/config.api';
import { HmacSHA256 } from 'crypto-js';
import * as Utils from './../utils';

let config: Configuration.IConfiguration = require('./../config/config.json');

export namespace UserBiz {

    export function seedDatabase(): Promise<any> {
        return new Promise<any>((resolve: Function, reject: Function) => {
            let users: User[] = require(config.database.seed.module).User;
            users.forEach((user: User) => {
                UserDAO.create(user)
                    .then((created: User) => Utils.Logger.logAndNotify(`seeded User ${created.username}`, 'mongodb-seed'))
                    .catch((reason: any) => Utils.Logger.errorAndNotify(`problem while seeding User: ${reason}`, 'mongodb-seed') && reject());
            });
            resolve();
        });
    }

    export function getUserInformation(userId: any): Promise<User> {
        return new Promise<User>((resolve: Function, reject: Function) => {
            if (!Utils.Validation.isInteger(userId)) {
                return reject(`The value ${userId} is not valid as an id.`);
            }
            UserDAO.findById(userId)
                .then((user: User) => {
                    resolve(user);
                })
                .catch((reason: any) => reject(`It was not possible to acquire the information for id ${userId}.`));
        });
    }

    export function createUser(userData: any): Promise<User> {
        return new Promise<User>((resolve: Function, reject: Function) => {
            if (!UserBusiness.typeCheck(userData)) {
                return reject('Invalid User: the body of this request did not meet the expectations.');
            }
            let user: User = new UserBuilder()
                .withName(userData.name)
                .withUsername(userData.username)
                .withPassword(HmacSHA256(userData.password, config.security.key).toString())
                .build();
            UserDAO.create(user)
                .then((created: User) => resolve(created))
                .catch((reason: any) => reject('It was not possible to create this User.'));
        });
    }

    export function deleteUser(userId: any): Promise<User> {
        return new Promise<User>((resolve: Function, reject: Function) => {
            if (!userId || !Utils.Validation.isInteger(userId)) {
                return reject(`The value ${userId} is not valid as an id.`);
            }
            if (parseInt(userId) === 1) {
                return reject(`The superuser cannot be deleted.`);
            }
            UserDAO.removeById(userId)
                .then((user: User) => {
                    resolve(user);
                })
                .catch((reason: any) => reject('It was not possible to delete this User.'));
        });
    }

    class UserBusiness {

        static typeCheck(object: any): boolean {
            return 'name' in object &&
                'username' in object &&
                'password' in object;
        }

    }

}