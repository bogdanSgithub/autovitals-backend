// Bogdan
import { DatabaseError } from "../models/DatabaseError.js";
import { InvalidInputError } from "../models/InvalidInputError.js";
import * as model from "../models/profileModel.js";
import express, { Request, Response } from 'express';
const router = express.Router();
const routeRoot = "/";
import logger from "../logger.js";
import { authenticate } from "./sessionController.js";
import { sendEmail } from "../scripts/emailSender.js";
import { logVisit } from "../scripts/loggerHelper.js";

router.post('/profiles/emailReminder', handleEmailReminder);
async function handleEmailReminder(request: Request, response: Response): Promise<void> {
    let result: string = "";
    try {
        if (!authenticate(request, response))
            return;
        sendEmail(request.body.email, request.body.subject, request.body.html);
    }
    catch (err: unknown) {
        if (err instanceof InvalidInputError) {
            response.status(400);
            result = `unsuccessful to send email reminder, invalid input ${err.message}`
            response.send(result);
            logger.error(result);
        }
        if (err instanceof Error) {
            response.status(400);
            result = `unsuccessful to send email reminder: ${err.message}`
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

router.post('/profiles', handleAddProfile);
/**
 * Creates a new user by the given firstName and lastName through the body in the request. It calls the addUser method of the model.
 * Sends back a response indicating if the operation was successful or if there were any issues.
 * @param request 
 * @param response 
 */
async function handleAddProfile(request: Request, response: Response): Promise<void> {
    // result variable used to log at the end.
    logVisit(request, response);
    let result: string = "";
    try {
        if (!authenticate(request, response))
            return;
        // get the firstName and lastName from the body, if they aren't passed then it's an InvalidInputError.
        const profile = await model.addProfile(request.body.email, request.body.isAdmin, request.body.username, request.body.coordinates, request.body.emailReminderPreference);
        result = `successfully added profile (${profile.email}, ${profile.username})`;
        response.status(200);
        response.send(profile);
        logger.info(result);
    }
    catch (err: unknown) {
        if (err instanceof InvalidInputError) {
            response.status(400);
            result = `unsuccessful to add profile, invalid input ${err.message}`
            response.send(result);
            logger.error(result);
        }
        else if (err instanceof DatabaseError) {
            response.status(500);
            result = `unsuccessful to add profile, database error ${err.message}`;
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

router.get("/profile/:username", handleGetOneProfile);
/**
 * Get a user by firstName which is in the URI in the request.
 * Calls the getOneUser method from model.
 * Sends back a response indicating if the operation was successful or if there were any issues.
 * @param request 
 * @param response 
 */
async function handleGetOneProfile(request: Request, response: Response): Promise<void> {
    logVisit(request, response);
    let result: string = "";
    try {
        if (!authenticate(request, response))
            return;
        const profile = await model.getOneProfile(request.params.username);
        result = `successfully found user (${profile.username})`;
        response.status(200);
        response.send(profile);
        logger.info(result);
    }
    catch (err: unknown) {
        if (err instanceof InvalidInputError) {
            response.status(400);
            result = `unsuccessful to find profile, invalid input ${err.message}`;
            response.send(result);
            logger.error(result);
        }
        else if (err instanceof DatabaseError) {
            response.status(500);
            result = `unsuccessful to find profile ${err.message}`;
            logger.error(result);
            response.send(result);
        }
        else {
            response.status(400);
            result = `An unexpected error occurred ${err}`;
            logger.fatal(result);
            response.send(result);
        }
    }
}

router.get("/profiles/", handleGetAllProfiles);
/**
 * Gets all the users using the getAllUsers method from model. 
 * Sends back a response indicating if the operation was successful or if there were any issues.
 * @param request 
 * @param response 
 */
async function handleGetAllProfiles(request: Request, response: Response): Promise<void> {
    logVisit(request, response);
    let result: string = "";
    try {
        if (!authenticate(request, response, true))
            return;

        const profiles = await model.getAllProfiles();
        result += `Profiles found: ${profiles.length}\n`;
        profiles.forEach((profile: model.Profile) => {
            result += `(${profile.email} ${profile.username})\n`;
        });
        console.table(profiles);
        response.status(200);
        response.send(profiles);
        logger.info(result);
    }
    catch (err: unknown) {
        if (err instanceof DatabaseError) {
            response.status(500);
            result = `database error ${err.message}`
            response.send(result);
            logger.error(result);
        }
        else {
            response.status(500);
            result = `An unexpected error occurred ${err}`
            response.send(result);
            logger.fatal(result);
        }
    }
}

router.put("/profiles/", handleUpdateProfile);
/**
 * Updates a user with the corresponding firstName, lastName in the body to the given newFirstName and newLastName in the body by firstName which is in the URI in the request.
 * Calls the updateOneUser method from model.
 * Sends back a response indicating if the operation was successful or if there were any issues.
 * @param request 
 * @param response 
 */
async function handleUpdateProfile(request: Request, response: Response): Promise<void> {
    logVisit(request, response);
    let result: string = "";
    const username = request.body.username;
    const profile: model.Profile = { email: request.body.email, isAdmin: request.body.isAdmin, username: request.body.username, coordinates: request.body.coordinates, emailReminderPreference :request.body.emailReminderPreference }
    try {
        if (!authenticate(request, response, true))
            return;
        const newProfile = await model.updateOneProfile(username, profile);
        response.status(200);
        result = `successfully updated old profile (${username}) to: (${profile.email}, ${profile.username})`;
        response.send(newProfile);
        logger.info(result);
    }
    catch (err: unknown) {
        if (err instanceof InvalidInputError) {
            response.status(400);
            result = `unsuccessful to update profile ${err.message}`;
            response.send(result);
            logger.error(result);
        }
        else if (err instanceof DatabaseError) {
            response.status(500);
            result = `unsuccessful to update profile ${err.message}`;
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

router.delete("/profiles/", handleDeleteProfile);
/**
 * Deletes a user with the given firstName through the body in the request. It calls the deleteOneUser method of the model.
 * Sends back a response indicating if the operation was successful or if there were any issues.
 * @param request 
 * @param response 
 */
async function handleDeleteProfile(request: Request, response: Response): Promise<void> {
    logVisit(request, response);
    let result: string = "";
    const username = request.body.username;
    const isAdminDelete = request.body.isAdminDelete;
    try {
        if (!authenticate(request, response, isAdminDelete))
            return;
        const isDeleted = await model.deleteOneProfile(username);
        if (isDeleted) {
          response.status(200);
          result = `successfully deleted profile (${username}).`;
          response.send(result);
          logger.info(result);
          
        }
        else {
            throw new InvalidInputError();
        }
    }
    catch (err: unknown) {
        if (err instanceof InvalidInputError) {
            response.status(400);
            result = `unsuccessful to delete profile, invalid input ${err.message}`;
            response.send(result);
            logger.error(result);
        }
        else if (err instanceof DatabaseError) {
            response.status(500);
            result = `unsuccessful to delete profile (${username}). ${err.message}`;
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

export {router, routeRoot};