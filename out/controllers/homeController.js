// Bogdan
import express from 'express';
import { authenticateUser, refreshSession } from './sessionController.js';
import * as profileModel from '../models/profileModel.js';
const router = express.Router();
const routeRoot = "/";
router.get("/", homeMessage);
async function homeMessage(request, response) {
    const authenticatedUser = authenticateUser(request);
    if (!authenticatedUser) {
        response.sendStatus(401); // Unauthorized access
        return;
    }
    console.log(`User ${authenticatedUser.userSession.username} is authorized for home page`);
    const profile = await profileModel.getOneProfile(authenticatedUser.userSession.username);
    console.log(`${profile.email}`);
    response.status(200);
    refreshSession(request, response);
    response.send("This is a cool homepage wow!");
}
export { router, routeRoot };
//# sourceMappingURL=homeController.js.map