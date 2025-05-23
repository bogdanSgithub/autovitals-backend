// Bogdan
import { MongoError, Db, MongoClient, Collection, Document } from "mongodb";
import * as validateUtils from "./validateUtils";
import { DatabaseError } from "./DatabaseError";
import { InvalidInputError } from "./InvalidInputError";
import * as model from "./profileModel";
import { EmailReminderPreference } from "./profileModel";
import { MongoMemoryServer } from "mongodb-memory-server";
let mongod : MongoMemoryServer;

const dbName = "profiles_db_test";

function generateUserData(): model.Profile {
    return {email: "Bob@gmail.com", username: "1", isAdmin: false, coordinates: [10, 10], emailReminderPreference: "none"};
}

/**
 * called before all tests, creates an instance of MongoMemoryServer, allowing us to have a mock database locally on which we run our tests.
 */
beforeAll(async () => {
    // This will create a new instance of "MongoMemoryServer" and automatically start it
    mongod = await MongoMemoryServer.create();
    console.log("Mock Database started");
  });
  

/**
 * called before each test. Re initializes the databse that way there is no dependency between the tests and we know what we are starting with.
 */
beforeEach(async () => {
    const url : string = mongod.getUri();
    try {
         await model.initialize(dbName, true, url);
    } catch (err: unknown) {
        if (err instanceof Error) {
          console.log(err.message);
        } else {
          console.log("An unknown error occurred.");
        }
     }
  });

  /**
   * Called after each test. Closes the connection to mongodb.
   */
afterEach(async () => {
    await model.close()
});

/**
 * Stops the mock database.
 */
afterAll(async () => {  
    await mongod.stop(); // Stop the MongoMemoryServer
    console.log("Mock Database stopped");
  });    

/**
 * Test to see if you can add a user to db. Really an integration test. We call addUser then we fetch the collection to make sure
 * it added the correct user. Database is empty beforehand.
 */
test('Can add User to collection', async () => {
    const newUser : model.Profile = generateUserData();
    await model.addProfile(newUser.email, newUser.isAdmin, newUser.username, newUser.coordinates, newUser.emailReminderPreference);
    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);
    expect(results[0].email.toLowerCase() == newUser.email.toLowerCase()).toBe(true);
    expect(results[0].emailReminderPreference.toLowerCase() == newUser.emailReminderPreference.toLowerCase()).toBe(true);
});

/**
 * Same as last test but now the colleciton is not empty beforehand.
 */
/*
test('Can add User to collection that is not empty', async () => {
    await model.addProfile("ValidUser", "ValidLastName");

    const newUser : model.Profile = generateUserData();
    await model.addProfile(newUser.firstName, newUser.lastName);
    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(2);
    expect(results[1].firstName.toLowerCase() == newUser.firstName.toLowerCase()).toBe(true);
    expect(results[1].lastName.toLowerCase() == newUser.lastName.toLowerCase()).toBe(true);
});
*/
/**
 * Makes sure that we get an InvalidInputError when we try to add an invalid user.
 */
/*
test('Cannot add invalid User to collection', async () => {
    const invalidUser : model.User = {firstName: "123", lastName: "123"};
    let errorCaught = false;
    try {
      await model.addUser(invalidUser.firstName, invalidUser.lastName);
    } catch (error) {
      errorCaught = true;
      expect(error).toBeInstanceOf(InvalidInputError);
    }
    expect(errorCaught).toBe(true);

    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
});*/

/**
 * Test to check that we can get a user by firstname and lastname. That is the only user in the collection.
 */
/*
test('Can read User from collection', async () => {
    const user : model.User = generateUserData();
    await model.addUser(user.firstName, user.lastName);
    const actualUser = await model.getOneUser(user.firstName);
    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);
    expect(results[0].firstName.toLowerCase() == actualUser.firstName.toLowerCase()).toBe(true);
    expect(results[0].lastName.toLowerCase() == actualUser.lastName.toLowerCase()).toBe(true);
});*/

/**
 * Same as above but there is another document in the collection
 */
/*
test('Can read User from collection with 2 documents', async () => {
    await model.addUser("ValidUser", "ValidLastName");

    const user : model.User = generateUserData();
    await model.addUser(user.firstName, user.lastName);
    const actualUser = await model.getOneUser(user.firstName);
    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(2);
    expect(results[1].firstName.toLowerCase() == actualUser.firstName.toLowerCase()).toBe(true);
    expect(results[1].lastName.toLowerCase() == actualUser.lastName.toLowerCase()).toBe(true);
});*/

/**
 * Tests to check that we get a Database Error when trying to get a user from empty collection
 */
/*
test('InvalidInputError if read from empty collection', async () => {
    const user : model.User = generateUserData();
    let errorCaught = false;
    try {
        await model.getOneUser(user.firstName);
      } catch (error) {
        errorCaught = true;
        expect(error).toBeInstanceOf(InvalidInputError);
      }
      expect(errorCaught).toBe(true);

      const cursor = await model.getCollection().find();
      const results = await cursor.toArray();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
});*/

/**
 * Tests to check that we can read all users in collection. Only 1 document in collection.
 */
/*
test('Can read Users from collection', async () => {
    const user : model.User = generateUserData();
    await model.addUser(user.firstName, user.lastName);
    const users = await model.getAllUsers();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBe(1);
    expect(users[0].firstName.toLowerCase() == user.firstName.toLowerCase()).toBe(true);
    expect(users[0].lastName.toLowerCase() == user.lastName.toLowerCase()).toBe(true);
});*/

/**
 * Same as above but now there are 2 documents in collection.
 */
/*
test('Can read Users from collection of 2 documents', async () => {
    await model.addUser("Valid", "Valid");
    const user : model.User = generateUserData();
    await model.addUser(user.firstName, user.lastName);
    const users = await model.getAllUsers();

    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBe(2);
    expect(users[0].firstName.toLowerCase() == "Valid".toLowerCase()).toBe(true);
    expect(users[0].lastName.toLowerCase() == "Valid".toLowerCase()).toBe(true);
    expect(users[1].firstName.toLowerCase() == user.firstName.toLowerCase()).toBe(true);
    expect(users[1].lastName.toLowerCase() == user.lastName.toLowerCase()).toBe(true);
});*/

/**
 * Read all from empty collection. Technically should not be an error. Makes sure it's an empty collection.
 */
/*
test('Read all from empty collection', async () => {
    const users = await model.getAllUsers();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBe(0);
});*/

/**
 * Tests to check that we can update a user in the collection. This is the only document in the collection.
 */
/*
test('Can update User in collection', async () => {
    const user : model.User = generateUserData();
    await model.addUser(user.firstName, user.lastName);
    const newUser = await model.updateOneUser(user.firstName, user.lastName, {firstName: "Valid", lastName: "Valid"});
    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);
    expect(results[0].firstName.toLowerCase() == newUser.firstName.toLowerCase()).toBe(true);
    expect(results[0].lastName.toLowerCase() == newUser.lastName.toLowerCase()).toBe(true);
});*/

/**
 * Same as above but now there are 2 documents in collection.
 */
/*
test('Can update User in collection of multiple documents', async () => {
    await model.addUser("ValidUser", "ValidLastName");
    const user : model.User = generateUserData();
    await model.addUser(user.firstName, user.lastName);
    const newUser = await model.updateOneUser(user.firstName, user.lastName, {firstName: "Valid", lastName: "Valid"});
    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(2);
    expect(results[1].firstName.toLowerCase() == newUser.firstName.toLowerCase()).toBe(true);
    expect(results[1].lastName.toLowerCase() == newUser.lastName.toLowerCase()).toBe(true);
});*/

/**
 * Makes sure it throws an InvalidInputError when trying to update a user to something that is invalid.
 */
/*
test('Cannot update invalid User in collection', async () => {
    const user : model.User = generateUserData();
    await model.addUser(user.firstName, user.lastName);
    const invalidUser : model.User = {firstName: "123", lastName: "123"};
    let errorCaught = false;
    try {
      await model.updateOneUser(user.firstName, user.lastName, invalidUser);
    } catch (error) {
      errorCaught = true;
      expect(error).toBeInstanceOf(InvalidInputError);
    }
    expect(errorCaught).toBe(true);

    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);
});*/

/**
 * Makes sure to throw DatabaseError when trying to update a user that is an empty collection.
 */
/*
test('Cannot update User that is not in empty collection', async () => {
    const user : model.User = generateUserData();
    let errorCaught = false;
    try {
      await model.updateOneUser(user.firstName, user.lastName, user);
    } catch (error) {
      errorCaught = true;
      expect(error).toBeInstanceOf(InvalidInputError);
    }
    expect(errorCaught).toBe(true);

    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
});*/

/**
 * Same as above but now collection is not empty
 */
/*
test('Cannot update User that is not in collection', async () => {
    const user : model.User = generateUserData();
    await model.addUser(user.firstName, user.lastName);
    const invalidUser : model.User = {firstName: "123", lastName: "123"};
    let errorCaught = false;
    try {
      await model.updateOneUser("NotInDb", "NotInDb", user);
    } catch (error) {
      errorCaught = true;
      expect(error).toBeInstanceOf(InvalidInputError);
    }
    expect(errorCaught).toBe(true);

    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);
});*/

/**
 * Tests to check that we can delete user from collection. Only 1 document in the collection.
 */
/*
test('Can delete User in collection', async () => {
    const user : model.User = generateUserData();
    await model.addUser(user.firstName, user.lastName);
    const result = await model.deleteOneUser(user.firstName, user.lastName);
    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();
    expect(result).toBe(true);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
});*/

/**
 * Same as above but now 2 documents in collection.
 */
/*
test('Can delete User in collection of multiple documents', async () => {
    await model.addUser("ValidUser", "ValidLastName");
    const user : model.User = generateUserData();
    await model.addUser(user.firstName, user.lastName);
    const result = await model.deleteOneUser(user.firstName, user.lastName);
    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();
    expect(result).toBe(true);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);
    expect(results[0].firstName.toLowerCase() == "ValidUser".toLowerCase()).toBe(true);
    expect(results[0].lastName.toLowerCase() == "ValidLastName".toLowerCase()).toBe(true);
});*/

/**
 * Tests that it throws an invalid input error when trying to delete an invalid user.
 */
/*
test('Cannot delete invalid User in collection', async () => {
    const user : model.User = generateUserData();
    await model.addUser(user.firstName, user.lastName);
    const invalidUser : model.User = {firstName: "123", lastName: "123"};
    let errorCaught = false;
    try {
      await model.deleteOneUser(invalidUser.firstName, invalidUser.lastName);
    } catch (error) {
      errorCaught = true;
      expect(error).toBeInstanceOf(InvalidInputError);
    }
    expect(errorCaught).toBe(true);

    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);
});*/

/**
 * Throws a database error when trying to delete user from empty collection
 */
/*
test('Cannot delete User of empty collection', async () => {
    const user : model.User = generateUserData();
    let errorCaught = false;
    try {
      await model.deleteOneUser(user.firstName, user.lastName);
    } catch (error) {
      errorCaught = true;
      expect(error).toBeInstanceOf(InvalidInputError);
    }
    expect(errorCaught).toBe(true);

    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
});*/

/**
 * same as above but collection is not empty
 */
/*
test('Cannot delete User that is not in collection', async () => {
    const user : model.User = generateUserData();
    await model.addUser(user.firstName, user.lastName);
    let errorCaught = false;
    try {
      await model.deleteOneUser("NotInDb", "NotInDb");
    } catch (error) {
      errorCaught = true;
      expect(error).toBeInstanceOf(InvalidInputError);
    }
    expect(errorCaught).toBe(true);

    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);
});*/
