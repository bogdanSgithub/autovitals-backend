// Bogdan
import { MongoError, Db, MongoClient, Collection, Document } from "mongodb";
import * as validateUtils from "./validateUtils.js";
import { DatabaseError } from "./DatabaseError.js";
import { InvalidInputError } from "./InvalidInputError.js";
import logger from "../logger.js";
import bcrypt from 'bcrypt';
import validator from "validator";
const saltRounds = 10;

let client : MongoClient;
let usersCollection: Collection<User> | undefined;

/** Returns true if there is a stored user with the same username and password. */
async function checkCredentials(username: string, password: string): Promise<boolean> {
    const user = await usersCollection?.findOne({username});
    if (!user) {
        return false;
    }
    const isSame = await bcrypt.compare(password, user.password);
    return isSame;
}

interface User {
    username: string;
    password: string;
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
      let collectionCursor = db.listCollections({ name: "users" });
      let collectionArray = await collectionCursor.toArray();
      if (collectionArray.length == 0 || reset) {
          // No match was found, so create new collection
          await db.createCollection("users", { collation: collation });
      }    
      usersCollection = db.collection("users"); // convenient access to collection
      if (reset) {
        await usersCollection.drop();
        await db.createCollection("users", { collation: collation });
        usersCollection = db.collection("users");
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

async function addUser(username: string, password: string): Promise<User> {
    try {
        if (!usersCollection) {
            throw new DatabaseError("Collection not initialized");
        }
        if (!username || !password) {
            throw new InvalidInputError("Username or password are empty");
        }
        if ((await usersCollection?.findOne({username})) !== null) {
            throw new InvalidInputError("That Username is not available");
        }
        if (!validator.isStrongPassword(password)) {
            throw new Error("Not a strong password");
        }
        if (!validator.isAlphanumeric(username)) {
            throw new Error("username must be alphanumeric");
        }
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const newUser: User = {username: username, password: hashedPassword};
        await usersCollection.insertOne(newUser);
        return newUser;
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

async function getOneUser(username: string): Promise<User> {
    if (!usersCollection) {
        throw new DatabaseError("Collection not initialized");
    }
    try {
        const match = await usersCollection.findOne<User>({ username }); 
        if (!match)
            throw new InvalidInputError("User not found");
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

async function deleteOneUser(username: string): Promise<boolean> {
    if (!usersCollection) {
        throw new DatabaseError("Collection not initialized");
    }
    try {
        const result = await usersCollection.deleteOne({ username }); 
        if (result.deletedCount === 0) {
            throw new InvalidInputError(`Profile: (${username}) not found.`);
        }
        logger.info(`deleted user ${username}`);
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

function getCollection() : Collection<User> {
    if (!usersCollection) {
        logger.error(`Error: Collection is not defined.  Db should have been initialized properly before use.`);
        throw new DatabaseError("Collection is not defined.  Db should have been initialized properly before use.");
    }
    logger.info(`got collection: ${getCollection}`);
    return usersCollection;
}

export {initialize, addUser, getOneUser, close, getCollection, checkCredentials, deleteOneUser, User};