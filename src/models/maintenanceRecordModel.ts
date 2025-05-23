import { Collection, MongoError } from "mongodb";
import logger from "../logger.js";
import { MongoClient, Db } from 'mongodb';

import * as dotenv from 'dotenv';
dotenv.config();

const url = `${process.env.URL_PRE}${process.env.MONGODB_PWD}${process.env.URL_POST}`
const dbName = "car_maintenance";

let client: MongoClient;
let db: Db;

export async function connectToDatabase(): Promise<Db> {
  if (db) return db;

  try {
    client = new MongoClient(url);
    await client.connect();
    console.log("✅ Connected to MongoDB");
    db = client.db(dbName);
    return db;
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    throw err;
  }
}

export default interface MaintenanceRecord {
    carPart: string;
    lastChanged: string;
    mileage: string;
    carId: string;
    price: string;
}

let maintenanceRecordsCollection: Collection<MaintenanceRecord>;

/**
 * Retrieves the MongoDB collection for the maintenance records.
 * If the collection has not been initialized yet, it connects to the database
 * and initializes the collection.
 * @returns The MongoDB collection for the maintenance records.
 * @throws {Error} If the initialization fails, either due to a MongoDB error or an unknown error.
 */
async function getMaintenanceCollection(): Promise<
  Collection<MaintenanceRecord>
> {
  if (!maintenanceRecordsCollection) {
    const db = await connectToDatabase();
    maintenanceRecordsCollection =
      db.collection<MaintenanceRecord>("maintenance");
  }
  return maintenanceRecordsCollection;
}

/**
 * Adds a maintenance record to the database. 
 * @param record - The maintenance record to add.
 * @returns The added record.
 * @throws {Error} If the addition fails, either due to a MongoDB error or an unknown error.
 */
export async function addMaintenanceRecord(
  record: MaintenanceRecord): Promise<MaintenanceRecord> {
  try {
    const collection = await getMaintenanceCollection();
    const result = await collection.insertOne(record);
    logger.info("✅ Inserted maintenance record:", result.insertedId);
    return record;
  } catch (err: unknown) {
    if (err instanceof MongoError) {
      logger.error("❌ MongoDB error:", err.message);
      throw new Error("Failed to insert maintenance record.");
    } else {
      logger.error("❌ Unexpected error:", err);
      throw new Error("Something went wrong while adding the record.");
    }
  }
}

/**
 * Retrieves a single maintenance record from the database with the given car part.
 * @param carPart - The car part of the record to retrieve.
 * @returns The retrieved record, or null if no record exists with the given car part.
 * @throws {Error} If the retrieval fails, either due to a MongoDB error or an unknown error.
 */
export async function getOneMaintenanceRecord(carId : string, carPart: string): Promise<MaintenanceRecord | null> {
  try {
    const collection = await getMaintenanceCollection();
    const record = (await collection.findOne({ carPart: carPart, carId: carId})) || null;
    logger.info(`Fetched record:`, record);
    return record;
  } catch (err: unknown) {
    if (err instanceof MongoError) {
      logger.error("❌ MongoDB error:", err.message);
      throw new Error("Failed to insert maintenance record.");
    } else {
      logger.error("❌ Unexpected error:", err);
      throw new Error("Something went wrong while adding the record.");
    }
  }
}

export async function getAllMaintenances(): Promise<
  Array<MaintenanceRecord>
> {
  try {
    const collection = await getMaintenanceCollection();
    const records = (await collection.find({})).toArray();
    logger.info(`Fetches list of records: ${records}`);
    return records;
  } catch (err: unknown) {
    if (err instanceof MongoError) {
      logger.error("❌ MongoDB error:", err.message);
      throw new Error("Failed to insert maintenance record.");
    } else {
      logger.error("❌ Unexpected error:", err);
      throw new Error("Something went wrong while adding the record.");
    }
  }
}

/**
 * Retrieves a list of all maintenance records from the database.
 * @returns A list of all maintenance records in the database.
 * @throws {Error} If the retrieval fails, either due to a MongoDB error or an unknown error.
 */
export async function getAllMaintenanceRecord(carId : string): Promise<
  Array<MaintenanceRecord>
> {
  try {
    const collection = await getMaintenanceCollection();
    const records = (await collection.find({carId: carId})).toArray();
    logger.info(`Fetches list of records: ${records}`);
    return records;
  } catch (err: unknown) {
    if (err instanceof MongoError) {
      logger.error("❌ MongoDB error:", err.message);
      throw new Error("Failed to insert maintenance record.");
    } else {
      logger.error("❌ Unexpected error:", err);
      throw new Error("Something went wrong while adding the record.");
    }
  }
}
/**
 * Deletes a single maintenance record from the database with the given car part.
 * @param carPart - The car part of the record to delete.
 * @returns If the record is found and deleted, it returns nothing (void). If no record is found, it returns null.
 * @throws {Error} If the deletion fails, either due to a MongoDB error or an unknown error.
 */

export async function deleteOneMaintenanceRecord(carId : string, carPart: string): Promise<void | null> {
  try {
    const collection = await getMaintenanceCollection();
    const result = await collection.deleteOne({ carPart: carPart, carId:carId });
    if (result.deletedCount === 0) {
      logger.info(`No record found for car part: ${carPart}`);
      return null;
    }

    console.log(`Deleted record for car part: ${carPart}`);
    return;
  } catch (err: unknown) {
    if (err instanceof MongoError) {
      logger.error("❌ MongoDB error:", err.message);
      throw new Error("Failed to insert maintenance record.");
    } else {
      logger.error("❌ Unexpected error:", err);
      throw new Error("Something went wrong while adding the record.");
    }
  }
}
/**
 * Updates a single maintenance record in the database with the given car part.
 * @param carPart - The car part of the record to update.
 * @param record - The new record to update to.
 * @returns The updated record, or null if no record exists with the given car part.
 * @throws {Error} If the update fails, either due to a MongoDB error or an unknown error.
 */

export async function updateOneMaintenanceRecord( carId:string, carPart: string, record: MaintenanceRecord): Promise<MaintenanceRecord | null> {
  try{
    const collection = await getMaintenanceCollection();
    const result = await collection.findOneAndUpdate({ carPart: carPart, carId:carId }, { $set: record }, { upsert: false });
    if (!result) {
      logger.info(`No record found for car part: ${carPart}`);
      return null;
    }
    return result;
  }catch (err: unknown) {
    if (err instanceof MongoError) {
      logger.error("❌ MongoDB error:", err.message);
      throw new Error("Failed to insert maintenance record.");
    } else {
      logger.error("❌ Unexpected error:", err);
      throw new Error("Something went wrong while adding the record.");
    }
  }
}

