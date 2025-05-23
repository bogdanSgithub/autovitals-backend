import express, { Request, Response } from 'express';
import * as model from "../models/carModel.js";
import {Car} from "../models/carModel.js"

import { DatabaseError } from '../models/DatabaseError.js';
import { InvalidInputError } from '../models/InvalidInputError.js';
import logger from '../logger.js';

const router = express.Router();
const routeRoot = "/cars";

router.post("/", addCarHandler)
router.get("/:id", readSingleCarHandler)
router.get("/all/:id", readAllCarHandler)
router.put("/", updateCarHandler)
router.delete("/:id", deleteCarHandler)


/**
 * Handles adding a single car to the database.
 * Will return a 200 code if succesful, a 400 code if inputs are invalid, a 500 code if there is a db error and a 503 if an unknown error occurs.
 * 
 * @param request The HTTP request.
 * @param response The HTTP response object.
 */
async function addCarHandler(request: Request, response: Response){
    try{
        const car: Car = await model.addCar(request.body.model, request.body.year, request.body.mileage, request.body.dateBought, request.body.url, request.body.userID)
        response.status(200)
        response.send(car)
        logger.info("Adding was succesful")    
    }
    catch(err: unknown){
        if (err instanceof InvalidInputError){
            response.status(400)
            response.send(`Inputs are invalid: ${err.message}`)
            logger.error("Given inputs are invalid.")
        }
        else if (err instanceof DatabaseError){
            response.status(500)
            response.send(`An error occured while interacting with the database: ${err.message}`)
            logger.error("Database error occured.")
        }
        else{
            response.status(503)
            response.send(`An unknown error occured: ${err}`)
            logger.fatal("An uncaught exception has occured.")
        }
    }
}

/**
 * Handles reading all cars from the database related to a user and displays cars in console and response.
 * Will return a 200 code if succesful, a 500 code if there is a db error and a 503 if an unknown error occurs.
 * 
 * @param request The HTTP request.
 * @param response The HTTP response object.
 */
async function readAllCarHandler(request: Request, response: Response){
    try{
        let cars: Car[] | undefined = []

        if (process.env.TESTING === "true"){
            cars = await model.getAllCars()
        } 
        else{
            cars = await model.getAllCarsForUser(request.params.id)
        }
        
                
        response.status(200)
        logger.info("Reading all was succesful")    

        //diplay array to console
        console.table(cars)

        response.json(cars)
    }
    catch(err: unknown){
        if (err instanceof DatabaseError){
            response.status(500)
            response.send(`An error occured while interacting with the database: ${err.message}`)
            logger.error("Database error occured.")
        }
        else{
            response.status(503)
            response.send(`An unknown error occured: ${err}`)
            logger.fatal("An uncaught exception has occured.")

        }
        
    }
}

/**
 * Handles reading a single car from the database. The found car is the first match in the database.
 * Will return a 200 code if succesful, a 400 code if inputs are invalid, a 500 code if there is a db error and a 503 if an unknown error occurs.
 * 
 * @param request The HTTP request.
 * @param response The HTTP response object.
 */
async function readSingleCarHandler(request: Request, response: Response){
    try{
        const car = await model.getSingleCar(request.params.id)
        response.status(200)
        response.send(car)
        logger.info("Reading single car was successful")    
    }
    catch(err: unknown){
        if (err instanceof InvalidInputError){
            response.status(400)
            response.send(`Inputs are invalid: ${err.message}`)
            logger.error("Given inputs are invalid.")
        }
        else if (err instanceof DatabaseError){
            response.status(500)
            response.send(`An error occured while interacting with the database: ${err.message}`)
            logger.error("Database error occured.")
        }
        else{
            response.status(503)
            response.send(`An unknown error occured: ${err}`)
            logger.fatal("An uncaught exception has occured.")
        }
    }
}

/**
 * Handles updating a single car from the database. The updated car is the first match in the database.
 * Will return a 200 code if succesful, a 400 code if inputs are invalid, a 500 code if there is a db error and a 503 if an unknown error occurs.
 * 
 * @param request The HTTP request.
 * @param response The HTTP response object.
 */
async function updateCarHandler(request: Request, response: Response){
    try{
        const car: Car = await model.updateCar(request.body.id, request.body.newModel, request.body.newYear, request.body.newMileage, request.body.newURL ,request.body.dateBought)
        response.status(200)
        logger.info("Car was succesfully updated.")

        response.send(car)    
    }
    catch(err: unknown){
        if (err instanceof InvalidInputError){
            response.status(400)
            logger.error("Given inputs are invalid.")
            console.log(err.message)
            response.send(`Inputs are invalid: ${err.message}`)
        }
        else if (err instanceof DatabaseError){
            response.status(500)
            response.send(`An error occured while interacting with the database: ${err.message}`)
            logger.error("Database error occured.")
        }
        else{
            response.status(503)
            response.send(`An unknown error occured: ${err}`)
            logger.fatal("An uncaught exception has occured.")
        }
        
    }
}

/**
 * Handles deleting a single car from the database. The deleted car is the first match in the database.
 * Will return a 200 code if succesful, a 400 code if inputs are invalid, a 500 code if there is a db error and a 503 if an unknown error occurs.
 * 
 * @param request The HTTP request.
 * @param response The HTTP response object.
 */
async function deleteCarHandler(request: Request, response: Response){
    try{
        const car: Car = await model.deleteCar(request.params.id)
        response.status(200)
        logger.info("Car was succesfully deleted.")

        response.send(car)    
    }
    catch(err: unknown){
        if (err instanceof InvalidInputError){
            response.status(400)
            logger.error("Given inputs are invalid.")
            response.send(`Inputs are invalid: ${err.message}`)
        }
        else if (err instanceof DatabaseError){
            response.status(500)
            logger.error("Database error occured.")
            response.send(`An error occured while interacting with the database: ${err.message}`)
        }
        else{
            response.status(503)
            response.send(`An unknown error occured: ${err}`)
            logger.fatal("An uncaught exception has occured.")
        }
        
    }
}


export {router, routeRoot};
