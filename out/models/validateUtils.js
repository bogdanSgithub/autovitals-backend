import validator from "validator";
import * as userModel from "./userModel.js";
/**
 * Check to see if the given first name and last name are non-empty and comprised of
 *   only letters
 * @param {string} firstName
 * @param {string} lastName
 * @returns true if both firstName and lastName are valid.  false otherwise
 */
function isValid(firstName, lastName) {
    if ((!firstName || !validator.isAlpha(firstName)) || (!lastName || !validator.isAlpha(lastName))) {
        return false;
    }
    return true;
}
// Bogdan
async function isValidProfile(email, username, emailReminderPreference) {
    const user = await userModel.getOneUser(username);
    if (!user) {
        return false;
    }
    if (!email || email === "" || !validator.isEmail(email) || !user || !emailReminderPreference) {
        return false;
    }
    return true;
}
export { isValid, isValidProfile };
//# sourceMappingURL=validateUtils.js.map