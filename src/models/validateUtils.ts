import validator from "validator";
import * as userModel from "./userModel.js";
import { InvalidInputError } from "./InvalidInputError.js";

/**
 * Check to see if the given first name and last name are non-empty and comprised of 
 *   only letters
 * @param {string} firstName
 * @param {string} lastName
 * @returns true if both firstName and lastName are valid.  false otherwise
 */
function isValid(firstName: string, lastName: string) {
  if ((!firstName || !validator.isAlpha(firstName)) || (!lastName || !validator.isAlpha(lastName))) {
    return false;
  }
  return true;
}

// Bogdan
async function isValidProfile(email: string, username: string, emailReminderPreference: string): Promise<boolean> {
  const user = await userModel.getOneUser(username);
  if (!user) {
    return false;
  }
  if (!email || email === "" || !validator.isEmail(email) || !user || !emailReminderPreference ) {
    throw new InvalidInputError("Invalid email")
  }
  return true;
}

export { isValid, isValidProfile };
