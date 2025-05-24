import * as model from "./userModel";
import { MongoError, Db, MongoClient, Collection, Document } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod : MongoMemoryServer;

const dbName = "users_db_test";
const strongPassword = "Abc123!@"
function generateUserData(): model.User {
    return {username: "1", password: strongPassword};
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
 * called before each test. Re initializes the database that way there is no dependency between the tests and we know what we are starting with.
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

test('Success Add User', async () => {
    const newUser : model.User = generateUserData();
    await model.addUser(newUser.username, newUser.password);
    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);
    expect(results[0].username.toLowerCase() == newUser.username.toLowerCase()).toBe(true);
    const validCredentials = await model.checkCredentials(newUser.username, newUser.password)
    expect(validCredentials).toBe(true);
});

test('Failure Add User duplicate username', async () => {
    const newUser = generateUserData();
    await model.addUser(newUser.username, newUser.password);

    await expect(model.addUser(newUser.username, newUser.password))
        .rejects
        .toThrow("Error: That Username is not available");
});

test('Failure Add User weak password', async () => {
    const newUser = { username: "user123", password: "abc" }; // weak password
    await expect(model.addUser(newUser.username, newUser.password))
        .rejects
        .toThrow("Error: Not a strong password");
});

test('Failure Add User invalid username', async () => {
    const newUser = { username: "bad@name", password: strongPassword };
    await expect(model.addUser(newUser.username, newUser.password))
        .rejects
        .toThrow("Error: username must be alphanumeric");
});

test('Failure Add User missing username or password', async () => {
    await expect(model.addUser("", strongPassword))
        .rejects
        .toThrow("Error: Username or password are empty");

    await expect(model.addUser("validuser", ""))
        .rejects
        .toThrow("Error: Username or password are empty");
});

test('Failure checkCredentials wrong password', async () => {
    const newUser = generateUserData();
    await model.addUser(newUser.username, newUser.password);

    const isValid = await model.checkCredentials(newUser.username, "WrongPassword123!");
    expect(isValid).toBe(false);
});

test('Failure checkCredentials non-existent user', async () => {
    const isValid = await model.checkCredentials("notfound", "somepassword");
    expect(isValid).toBe(false);
});

test('Success get User by username', async () => {
    const newUser = generateUserData();
    await model.addUser(newUser.username, newUser.password);
    const retrieved = await model.getOneUser(newUser.username);
    expect(retrieved.username).toBe(newUser.username);
});

test('Failure get User by invalid username', async () => {
    await expect(model.getOneUser("ghost"))
        .rejects
        .toThrow("Error: User not found");
});


test('Success delete User', async () => {
    const newUser = generateUserData();
    await model.addUser(newUser.username, newUser.password);
    const success = await model.deleteOneUser(newUser.username);
    expect(success).toBe(true);
});

test('Failure delte non-existent user', async () => {
    await expect(model.deleteOneUser("ghost"))
        .rejects
        .toThrow("Error: Profile: (ghost) not found.");
});
