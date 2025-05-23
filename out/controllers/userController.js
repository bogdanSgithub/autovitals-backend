// Bogdan
import express from 'express';
import { DatabaseError } from "../models/DatabaseError.js";
import { InvalidInputError } from "../models/InvalidInputError.js";
const router = express.Router();
const routeRoot = "/users";
import * as model from "../models/userModel.js";
import logger from "./../logger.js";
import { checkCredentials, } from '../models/userModel.js';
import { createSession, getSession } from './Session.js';
import { logVisit } from "../scripts/loggerHelper.js";
router.post("/register", registerUser);
/** Log a user in and create a session cookie that will expire in 2 minutes */
async function registerUser(request, response) {
    logVisit(request, response);
    let result = "";
    try {
        const username = request.body.username;
        const password = request.body.password;
        await model.addUser(username, password);
        if (username && password && await checkCredentials(username, password)) {
            logger.info("Successful login for " + username);
            const sessionId = createSession(username, 10);
            const session = getSession(sessionId);
            if (!session) {
                response.sendStatus(500);
                return;
            }
            // Save cookie that will expire.
            response.cookie("sessionId", sessionId, { expires: session.expiresAt, httpOnly: true, sameSite: "none", secure: true });
            result += `successfully registered ${username}`;
            response.status(200);
            response.send(username);
            logger.info(result);
            console.log(result);
            return;
        }
        else {
            logger.warn("Unsuccessful login for " + username);
            throw new Error("unsucessful login");
        }
    }
    catch (err) {
        if (err instanceof InvalidInputError) {
            response.status(400);
            result = `unsuccessful to register user, invalid input ${err.message}`;
            response.send(result);
            logger.error(result);
        }
        else if (err instanceof DatabaseError) {
            response.status(500);
            result = `unsuccessful to register user. something weird happened  ${err.message}`;
            response.send(result);
            logger.error(result);
        }
        else {
            response.status(500);
            result = `An unexpected error occurred ${err}`;
            response.send(result);
            logger.fatal(result);
        }
    }
}
export { router, routeRoot };
//# sourceMappingURL=userController.js.map