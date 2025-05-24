// Bogdan
import { MongoError, Db, MongoClient, Collection, Document } from "mongodb";
import * as validateUtils from "./validateUtils.js";
import { DatabaseError } from "./DatabaseError.js";
import { InvalidInputError } from "./InvalidInputError.js";
import logger from "../logger.js";
import { deleteOneUser } from "./userModel.js";

let client : MongoClient;
let profilesCollection: Collection<Profile> | undefined;

type EmailReminderPreference = 'none' | '1_day' | '3_days';

interface Profile {
    email: string;
    isAdmin: boolean;
    username: string;
    coordinates: Array<number>;
    emailReminderPreference: EmailReminderPreference;
    lastReminderSent?: string;
}

/**
 * 
 * @param dbName 
 * @param reset 
 * @param url 
 */
async function initialize(dbName: string, reset: Boolean, url: string) : Promise<void>{
    try {
      client = new MongoClient(url); // store connected client for use while the app is running
      await client.connect(); 
      const db: Db = client.db(dbName);
        
      // collation specifying case-insensitive collection
      const collation = { locale: "en", strength: 1 };
      // Check to see if the profiles collection exists
      let collectionCursor = db.listCollections({ name: "profiles" });
      let collectionArray = await collectionCursor.toArray();
      if (collectionArray.length == 0 || reset) {
          // No match was found, so create new collection
          await db.createCollection("profiles", { collation: collation });
      }    
      profilesCollection = db.collection("profiles"); // convenient access to collection
      if (reset) {
        await profilesCollection.drop();
        await db.createCollection("profiles", { collation: collation });
      }
      logger.info("db initialized");
      
    } catch (err) {
        if (err instanceof MongoError) {
            logger.error("MongoDB connection failed:", err.message);
          } else {
            logger.fatal("Unexpected error:", err);
          }
    } 
}	

/**
 * closes the mongodb connection
 */
async function close() {
    try {
      await client.close();
      logger.info("MongoDb connection closed");
    } catch (err: unknown) {
      if (err instanceof Error)
        logger.error(err.message)
      else
        logger.error("Unknown error during beforeEach in unit tests");
    }
}  

/**
 * Takes a firstName and lastName, uses isValid to make sure they are valid, if so then it adds the user to the profilesCollection
 * Either returns the newUser or throws an error if something went wrong
 * @param email 
 * @param isAdmin 
 * @param username 
 * @param coordinates 
 * @param emailReminderPreference 
 * @returns 
 */
async function addProfile(email: string, isAdmin: boolean, username: string, coordinates: Array<number>, emailReminderPreference: EmailReminderPreference): Promise<Profile>{
    if (! (await validateUtils.isValidProfile(email, username, emailReminderPreference))) {
        throw new InvalidInputError(`Not a valid Profile with email: ${email}, emailReminderPreference ${emailReminderPreference}`);
    }
    if (!profilesCollection) {
        throw new DatabaseError("Collection not initialized");
    }
    try {   
        const newProfile: Profile = {email: email, isAdmin: isAdmin, username: username, coordinates: coordinates, emailReminderPreference: emailReminderPreference, lastReminderSent: undefined};
        await profilesCollection.insertOne(newProfile);
        logger.info(`Inserted ${newProfile}`);
        return newProfile;
        }
    catch (err: unknown) {
        if (err instanceof InvalidInputError) {
            logger.error(`Error: ${err.message}`);
            throw new InvalidInputError(`Error: ${err.message}`);
        }
        else if (err instanceof MongoError) {
            logger.error(`Error: ${err.message}`);
            throw new DatabaseError(`Error: ${err.message}`);
        }
        else if (err instanceof DatabaseError) {
            logger.error(`Error: ${err.message}`);
            throw new DatabaseError(`Error: ${err.message}`);
        }
        else if (err instanceof Error) {
            logger.error(`Error: ${err.message}`);
            throw new DatabaseError("Error: " + err.message);
        }
        else {
            logger.fatal(`Unexpected Error`);
            throw new DatabaseError(`Unexpected Error`);
        }
    }
}

/**
 * Gets the profile that matches the provided username.
 * Returns the match if found, else throws an error if not found or something went wrong.
 * @param username 
 * @returns 
 */
async function getOneProfile(username: string): Promise<Profile> {
    if (!profilesCollection) {
        throw new DatabaseError("Collection not initialized");
    }
    try {
        const match = await profilesCollection.findOne<Profile>({ username }); 
        if (!match)
            throw new InvalidInputError("Profile not found");
        logger.info(`found ${match}`);
        return match; 
    }
    catch (err: unknown) {
        if (err instanceof InvalidInputError) {
            logger.error(`Error: ${err.message}`);
            throw new InvalidInputError(`Error: ${err.message}`);
        }
        else if (err instanceof MongoError) {
            logger.error(`Error: ${err.message}`);
            throw new DatabaseError(`Error: ${err.message}`);
        }
        else if (err instanceof DatabaseError) {
            logger.error(`Error: ${err.message}`);
            throw new DatabaseError(`Error: ${err.message}`);
        }
        else if (err instanceof Error) {
            logger.error(`Error: ${err.message}`);
            throw new DatabaseError("Error: " + err.message);
        }
        else {
            logger.fatal(`Unexpected Error`);
            throw new DatabaseError(`Unexpected Error`);
        }
    }
}

/**
 * Gets all the profiles from the collection and returns them in an array.
 * Throws an error if something went wrong.
 * @returns 
 */
async function getAllProfiles(): Promise<Array<Profile>> {
    if (!profilesCollection) {
        throw new DatabaseError("Collection not initialized");
    }
    try {
        const cursor = profilesCollection.find<Profile>({});
        const matches = await cursor.toArray()
        logger.info(`found ${matches}`);
        return matches; 
    }
    catch (err: unknown) {
        if (err instanceof MongoError) {
            logger.error(`Error: ${err.message}`);
            throw new DatabaseError(`Error: ${err.message}`);
        }
        else if (err instanceof DatabaseError) {
            logger.error(`Error: ${err.message}`);
            throw new DatabaseError(`Error: ${err.message}`);
        }
        else if (err instanceof Error) {
            logger.error(`Error: ${err.message}`);
            throw new DatabaseError("Error: " + err.message);
        }
        else {
            logger.fatal(`Unexpected Error`);
            throw new DatabaseError(`Unexpected Error`);
        }
    }
}


/**
 * Takes a firstName, lastName and new user and updates the first match to the new user.
 * Returns the newly updated object if success else it throws an error.
 * @param username 
 * @param newProfile 
 * @returns 
 */
async function updateOneProfile(username: string, newProfile: Profile): Promise<Profile> {
    if (!profilesCollection) {
        throw new DatabaseError("Collection not initialized");
    }
    if (!(await validateUtils.isValidProfile(newProfile.email, newProfile.username, newProfile.emailReminderPreference))) {
        throw new InvalidInputError(`Invalid profile update`)
    }
    try {
        const result = await profilesCollection.updateOne({username}, { $set: newProfile});

        if (result.matchedCount === 0) {
            throw new InvalidInputError(`Profile: (${username}) not found.`);
        }
        logger.info(`updated (${username}, ${newProfile.emailReminderPreference}) to (${newProfile.email}, ${newProfile.emailReminderPreference})`);
        return newProfile;
    }
    catch (err: unknown) {
        if (err instanceof InvalidInputError) {
            logger.error(`Error: ${err.message}`);
            throw new InvalidInputError(`Error: ${err.message}`);
        }
        else if (err instanceof MongoError) {
            logger.error(`Error: ${err.message}`);
            throw new DatabaseError(`Error: ${err.message}`);
        }
        else if (err instanceof DatabaseError) {
            logger.error(`Error: ${err.message}`);
            throw new DatabaseError(`Error: ${err.message}`);
        }
        else if (err instanceof Error) {
            logger.error(`Error: ${err.message}`);
            throw new DatabaseError("Error: " + err.message);
        }
        else {
            logger.fatal(`Unexpected Error`);
            throw new DatabaseError(`Unexpected Error`);
        }
    }
}

/**
 * Takes a firstName and lastName and deletes the first matching user in the database.
 * Returns true if sucess else throws an error.
 * @param firstName 
 * @param lastName 
 * @returns 
 */
async function deleteOneProfile(username: string): Promise<boolean> {
    if (!profilesCollection) {
        throw new DatabaseError("Collection not initialized");
    }
    if (! (await validateUtils.isValidProfile('test@gmail.com', username, 'lol'))) {
        throw new InvalidInputError(`Invalid user (${username})`)
    }
    try {
        const result = await profilesCollection.deleteOne({username});
        const userResult = await deleteOneUser(username);

        if (result.deletedCount === 0 || !userResult) {
            throw new InvalidInputError(`Profile: (${username}) not found.`);
        }
        logger.info(`deleted Profile: (${username})`);
        
        return true;
    }
    catch (err: unknown) {
        if (err instanceof InvalidInputError) {
            logger.error(`Error: ${err.message}`);
            throw new InvalidInputError(`Error: ${err.message}`);
        }
        else if (err instanceof MongoError) {
            logger.error(`Error: ${err.message}`);
            throw new DatabaseError(`Error: ${err.message}`);
        }
        else if (err instanceof DatabaseError) {
            logger.error(`Error: ${err.message}`);
            throw new DatabaseError(`Error: ${err.message}`);
        }
        else if (err instanceof Error) {
            logger.error(`Error: ${err.message}`);
            throw new DatabaseError("Error: " + err.message);
        }
        else {
            logger.fatal(`Unexpected Error`);
            throw new DatabaseError(`Unexpected Error`);
        }
    }
}

/**
 * Returns the profilesCollection if defined, else throws a Database error.
 * @returns 
 */
function getCollection() : Collection<Profile> {
    if (!profilesCollection) {
        logger.error(`Error: Collection is not defined.  Db should have been initialized properly before use.`);
        throw new DatabaseError("Collection is not defined.  Db should have been initialized properly before use.");
    }
    logger.info(`got collection: ${profilesCollection}`);
    return profilesCollection;
}
  

export {initialize, addProfile, getOneProfile, getAllProfiles, updateOneProfile, deleteOneProfile, close, getCollection, Profile, EmailReminderPreference};