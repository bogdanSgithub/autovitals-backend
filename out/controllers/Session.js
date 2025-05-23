// Bogdan
import { v4 as uuidv4 } from 'uuid';
console.log("Session store initialized");
// This object stores the user sessions so that we can store and retrieve by sessionId.
//  For larger scale applications, you can use a database or cache for this purpose.
const sessions = {};
function createSession(username, numMinutes) {
    // Generate a random UUID as the sessionId
    const sessionId = uuidv4();
    // Set the expiry time as numMinutes (in milliseconds) after the current time
    const expiresAt = new Date(Date.now() + numMinutes * 60000);
    // Create a session object containing information about the user and expiry time
    const thisSession = new Session(username, expiresAt);
    // Add the session information to the sessions map, using sessionId as the key
    sessions[sessionId] = thisSession;
    return sessionId;
}
function getSession(sessionId) {
    return sessions[sessionId];
}
function deleteSession(sessionId) {
    delete sessions[sessionId];
}
// Each session contains the username of the user and the time at which it expires
//  This object can be extended to store additional protected session information
class Session {
    username;
    expiresAt;
    constructor(username, expiresAt) {
        this.username = username;
        this.expiresAt = expiresAt;
    }
    // We'll use this method later to determine if the session has expired
    isExpired() {
        return this.expiresAt < new Date();
    }
}
export { Session, createSession, getSession, deleteSession };
//# sourceMappingURL=Session.js.map