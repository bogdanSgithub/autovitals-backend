import { readFile } from "fs/promises";
import { InvalidInputError } from './InvalidInputError.js';
import * as userModel from "./userModel.js"

/**
 * Validates the model and year for a car object.
 * 
 * @param {string} model The model of the car to verify.
 * @param {number} year The make year to verify.
 * @param {number} mileage The mileage to verify.
 * @param {Date} dateBought The date bought to verify.
 * @param {string} url The URL of the car image to verify.
 * @param {string} userID The ID of the user to verify.
 * @returns True if the car object is valid.
 */
async function isValid(model: string, year: number, mileage: number, dateBought: Date, url: string, userID?: string) {
    console.log("Model: " + model, "Year: " + year, "Mileage: " + mileage, "Date bought: " + dateBought, "URL: " + url, "UserID: " + userID)
    const minYear: number = 1990   

    if (!await isImageUrlAccessible(url)){
       throw new InvalidInputError("Image URL is invalid or inaccessible.");
    }

    if (!model) {
        throw new InvalidInputError("Model cannot be empty.");
    }

    if (year < minYear){
        throw new InvalidInputError("Make year of the car cannot be lower than 1990.")
    }

    if (mileage < 0){
        throw new InvalidInputError("Mileage cannot be negative.")
    }

    if (userID){
        if (await validUser(userID)){
           throw new InvalidInputError("User does not exist.")
        }
    }

    if (await validateModel(model)){
        return true
    }
    else{
        throw new InvalidInputError("Model is invalid. ex: Ford Focus, BMW 3 Series, etc.");
    }

}

async function validUser(username: string): Promise<boolean>{
    const user = await userModel.getOneUser(username);

    return user === null
}

async function isImageUrlAccessible(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentType = response.headers.get("Content-Type");
      return response.ok && contentType?.startsWith("image/")!;
    } catch (err) {
      throw new InvalidInputError("Image URL is invalid or inaccessible.");
    }
  }
  

async function validateModel(model: string): Promise<boolean> {
    try {
        const data = await readFile("public/carMakes.json", "utf-8");
        const parsed = JSON.parse(data);
        const makes: string[] = parsed.car_makes;

        for (const make of makes) {
            if (model.toLowerCase().includes(make.toLowerCase())) {
                return true;
            }
        }

        return false;
    }
    catch (err){
        throw new InvalidInputError("The model is invalid.");
    }
   
}

export { isValid };
