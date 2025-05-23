// Bogdan
import express, { Request, Response } from 'express';
const router = express.Router();
const routeRoot = "/session";
import logger from "./../logger.js";
import { Session, createSession, getSession, deleteSession } from "./Session.js"; 
import { checkCredentials } from '../models/userModel.js';
import * as model from "../models/profileModel.js";

const numMinutes = 20;

router.post("/login", loginUser);
/** Log a user in and create a session cookie that will expire in 2 minutes */
async function loginUser(request: Request, response: Response): Promise<void> {
    const username: string = request.body.username;
    const password: string = request.body.password;
    try {
      if (username && password && await checkCredentials(username, password)) {
        logger.info("Successful login for " + username);
        
        // Create a session object that will expire in 2 minutes
        const sessionId: string = createSession(username, numMinutes);
      
        const session = getSession(sessionId);
        if (!session) {
          response.sendStatus(500);
          return;
        }
        // Save cookie that will expire.
        response.cookie("sessionId", sessionId, { expires: session.expiresAt, httpOnly: true });
        response.sendStatus(200);
        return;
      }
      else {
        logger.warn("Unsuccessful login for " + username);
      }
    }
    catch (err: unknown) {
      if (err instanceof Error) {
        response.status(400);
        let result = `An unexpected error occurred ${err}`;
        response.send(result);
        logger.error(result);
      }
    }
    response.sendStatus(401);
  }

router.get('/logout', logoutUser);
function logoutUser(request: Request, response: Response): void {
    const authenticatedUser = authenticateUser(request);

    if (! authenticatedUser) {
        response.sendStatus(401); // Unauthorized access
        return;
    }

    // Delete the session from the session store
    deleteSession(authenticatedUser.sessionId);
    console.log("Logged out user " + authenticatedUser.userSession.username);

    // Clear cookie
    response.clearCookie("sessionId");

    response.sendStatus(200);
}  

router.get("/auth", authUser);
async function authUser(request: Request, response: Response): Promise<void> {
  try {
    console.log("hello?");
    const authenticatedSession = authenticateUser(request);
    if (!authenticatedSession) {
      console.log(`problem Cookies: ${JSON.stringify(request.cookies)}`);
      response.sendStatus(401);
    } else {
      console.log(`yes Cookies: ${JSON.stringify(request.cookies)}`);
      response.status(200).send(authenticatedSession.userSession.username);
    }
  } catch (error) {
    response.sendStatus(401);
  }
}

  interface AuthenticatedUser {
    sessionId: string;
    userSession: Session;
  }
  function authenticateUser(request: Request): AuthenticatedUser | null {
    // If this request doesn't have any cookies, that means it isn't authenticated. Return null.
    if (!request.cookies) {
      return null;
    }
    // We can obtain the session token from the requests cookies, which come with every request
    const sessionId = request.cookies['sessionId'];
    if (!sessionId) {  // If the cookie is not set, return null
      return null;
    }
    // We then get the session of the user from our session map
    const userSession = getSession(sessionId);
    
    // we want to authenticate a user if their username is the right username in that userSession
    if (!userSession) {
      return null;
    }
    // If the session has expired, delete the session from our map and return null
    if (userSession.isExpired()) {
      deleteSession(sessionId);
      return null;
    }
    return { sessionId, userSession }; // Successfully validated
  }

  function personalAuthenticateUser(request: Request, checkIsAdmin=false): AuthenticatedUser | null {
    // If this request doesn't have any cookies, that means it isn't authenticated. Return null.
    if (!request.cookies) {
      return null;
    }
    // We can obtain the session token from the requests cookies, which come with every request
    const sessionId = request.cookies['sessionId'];
    if (!sessionId) {  // If the cookie is not set, return null
      return null;
    }
    // We then get the session of the user from our session map
    const userSession = getSession(sessionId);
    
    // we want to authenticate a user if their username is the right username in that userSession
    if (!userSession || (request.params.username !== userSession.username &&
     request.body?.username !== userSession.username) )
    {
      return null;
    }
    // If the session has expired, delete the session from our map and return null
    if (userSession.isExpired()) {
      deleteSession(sessionId);
      return null;
    }
    return { sessionId, userSession }; // Successfully validated
  }

async function authenticateAdmin(request: Request, checkIsAdmin=false): Promise<AuthenticatedUser | null> {
  // If this request doesn't have any cookies, that means it isn't authenticated. Return null.
    if (!request.cookies) {
      return null;
    }
    // We can obtain the session token from the requests cookies, which come with every request
    const sessionId = request.cookies['sessionId'];
    if (!sessionId) {  // If the cookie is not set, return null
      return null;
    }
    // We then get the session of the user from our session map
    const userSession = getSession(sessionId);
  
    // we want to authenticate a user if their username is the right username in that userSession
    if (!userSession || request.params.username != userSession.username) {
      return null;
    }

    const profile = await model.getOneProfile(userSession.username);
    if (!profile.isAdmin) {
      return null;
    }

    // If the session has expired, delete the session from our map and return null
    if (userSession.isExpired()) {
      deleteSession(sessionId);
      return null;
    }
    return { sessionId, userSession }; // Successfully validated
  }
  
  function refreshSession(request: Request, response: Response): string | undefined {
    const authenticatedUser = authenticateUser(request);

    if (!authenticatedUser) {
        response.sendStatus(401); // Unauthorized access
        return;
    }
    // Create and store a new Session object that will expire in 2 minutes.
    const newSessionId: string = createSession(authenticatedUser.userSession.username, numMinutes);
    // Delete the old entry in the session map
    deleteSession(authenticatedUser.sessionId);

    const newSession = getSession(newSessionId);
    // If session is undefined (shouldn't happen, but just in case), clear out cookie
    if (!newSession) {   
        response.clearCookie("sessionId"); // essentially the user is no longer authenticated
    } else {
        // Set the session cookie to the new id we generated, with a renewed expiration time
        response.cookie("sessionId", newSessionId, { expires: newSession.expiresAt, httpOnly: true });
    }
    return newSessionId;
}

/**
 * This is a wrapper of the authentication logic. This is used in every single controller.
 * @param request 
 * @param response 
 * @returns 
 */
function authenticate(request: Request, response: Response, checkIsAdmin=false) {
  let authenticatedSession = null;
  if (checkIsAdmin) {
    authenticatedSession = authenticateAdmin(request);
  }
  else {
    authenticatedSession = personalAuthenticateUser(request);
  }
  
  if (!authenticatedSession) {
      response.sendStatus(401); // Unauthorized access
      return false;
  }
  return true;
}


export { router, routeRoot, loginUser, authenticateUser, refreshSession, authenticate };
