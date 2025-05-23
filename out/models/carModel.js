// Alot of this code was repurposed from the previous lab we've done on mongodb.
import { MongoError, MongoClient, ObjectId } from "mongodb";
import { InvalidInputError } from "./InvalidInputError.js";
import { DatabaseError } from "./DatabaseError.js";
import { isValid } from "./validation.js";
import logger from "../logger.js";
let dbName = "car_db";
let client;
let carsCollection;
/**
 * Initialize the database connection to the specified database and resets the collection if specified.
 *
 * @param dbname The name of the MongoDB database.
 * @param resetDBFlag Resets the collection if true, keeps it the same if false.
 */
async function initialize(dbname, resetDBFlag, url) {
    try {
        dbName = dbname;
        client = new MongoClient(url);
        await client.connect();
        logger.info("Connected successfully to DB!");
        const db = client.db(dbName);
        if (resetDBFlag) {
            await carsCollection?.drop();
        }
        const collectionCursor = db.listCollections({ name: "cars" });
        const collectionArray = await collectionCursor.toArray();
        if (collectionArray.length == 0) {
            const collation = { locale: "en", strength: 1 };
            await db.createCollection("cars", { collation: collation });
        }
        carsCollection = db.collection("cars");
    }
    catch (err) {
        if (err instanceof MongoError) {
            logger.error("Database error has occured");
            throw new DatabaseError("Connection to DB failed: " + err);
        }
        else {
            logger.error("An unknown error has occurred: " + err);
        }
    }
}
/**
 * Adds a car document to the MongoDB database.
 * @param model The model of the car to add.
 * @param year The make year of the car to add.
 * @param mileage The mileage of the car to add.
 * @param dateBought The date the car was bought.
 * @param url The URL of the cars picture.
 * @param userID The user ID of the car owner.
 */
async function addCar(model, year, mileage, dateBought, url, userID) {
    try {
        if (await isValid(model, year, mileage, dateBought, url, userID)) {
            await carsCollection?.insertOne({
                model: model,
                year: year,
                mileage: mileage,
                dateBought: dateBought,
                url: url,
                userID: userID
            });
        }
    }
    catch (err) {
        if (err instanceof InvalidInputError) {
            logger.error("InvalidInput error has occured!");
            throw err;
        }
        else if (err instanceof MongoError) {
            logger.error("A database error has occured!");
            throw new DatabaseError("An error occured while adding to the database: " + err.message);
        }
    }
    return { model: model, year: year, mileage: mileage, dateBought: dateBought, url: url, userID: userID };
}
/**
 * Gets a single car from the database based on id.
 *
 * @param id The id of the car to get.
 */
async function getSingleCar(id) {
    try {
        if (!carsCollection) {
            throw new DatabaseError("collection not initialized");
        }
        const car = await carsCollection.findOne({ _id: new ObjectId(id) });
        if (car === null) {
            throw new InvalidInputError("Car does not exist within database: " + id);
        }
        logger.info("Car succesfully found.");
        return car;
    }
    catch (err) {
        if (err instanceof InvalidInputError) {
            logger.error("Given input is invalid");
            throw err;
        }
        else if (err instanceof MongoError) {
            logger.error("A database error has occured!");
            throw new DatabaseError("An error occurred while interacting with the database: " + err);
        }
        else {
            logger.fatal("An unknown error has occured");
            throw new Error("An unexpected error happened: " + err);
        }
    }
}
/**
 * Gets all the car documents from the database for a certain user.
 *
 * @param id The id of the user to get the cars for.
 * @returns An array containing all of the car relating to that user in the database.
 */
async function getAllCarsForUser(id) {
    try {
        const carCursor = carsCollection?.find({ userID: id });
        const cars = await carCursor?.toArray();
        if (cars?.length === 0) {
            throw new DatabaseError("Database is empty.");
        }
        logger.info("Car succesfully accessed.");
        return cars;
    }
    catch (err) {
        if (err instanceof MongoError) {
            logger.error("Database error has occured.");
            throw new DatabaseError("An error occurred while interacting with the database: " + err);
        }
        else {
            logger.fatal("An unknown error has occured");
            throw new Error("An unexpected error happened: " + err);
        }
    }
}
/**
 * Updates the first matching record matching the passed model argument.
 *
 * @param id The id of the car to update.
 * @param newModel The new model of the car.
 * @param newYear The new make year of the car.
 * @param newMileage The new mileage of the car.
 * @param dateBought The new date the car was bought.
 * @returns The updated car object.
 */
async function updateCar(id, newModel, newYear, newMileage, newURL, newDateBought) {
    try {
        //check if car is in db before updating
        await getSingleCar(id);
        if (await isValid(newModel, newYear, newMileage, newDateBought, newURL)) {
            console.log(id);
            await carsCollection?.updateOne({ _id: new ObjectId(id) }, { $set: { model: newModel, year: newYear, mileage: newMileage, url: newURL, dateBought: newDateBought } });
            logger.info("Car was succesfully updated.");
        }
        else {
            throw new InvalidInputError(`newModel or newYear is invalid: ${id}`);
        }
    }
    catch (err) {
        if (err instanceof InvalidInputError) {
            logger.error("Given input is invalid");
            throw err;
        }
        else if (err instanceof MongoError) {
            logger.error("Database error has occured.");
            throw new DatabaseError("An error occured while interacting while interacting with the database: " +
                err.message);
        }
        else {
            logger.fatal("An unknown error has occured");
            throw new Error("An unexpected error happened: " + err);
        }
    }
    return { model: newModel, year: newYear, mileage: newMileage, url: newURL, dateBought: newDateBought, userID: id };
}
/**
 * Deletes the matching record made with the passed argument from the database.
 *
 * @param id The id of the car to delete.
 * @returns The id of the deleted car.
 */
async function deleteCar(id) {
    try {
        await getSingleCar(id);
        await carsCollection?.deleteOne({ _id: new ObjectId(id) });
        console.log(id);
        logger.info("Car was succesfully deleted.");
    }
    catch (err) {
        if (err instanceof MongoError) {
            logger.error("A database error has occured.");
            throw new DatabaseError("An error occured while interacting while interacting with the database: " +
                err.message);
        }
        else if (err instanceof InvalidInputError) {
            logger.error("Given input was invalid.");
            throw new InvalidInputError(err.message);
        }
        else {
            logger.fatal("An unknown error has occured");
            throw new Error("An unexpected error happened: " + err);
        }
    }
    return id;
}
export { addCar, getSingleCar, getAllCarsForUser, updateCar, deleteCar, initialize };
//# sourceMappingURL=carModel.js.map