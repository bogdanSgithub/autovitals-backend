// Bogdan
import { InvalidInputError } from "./InvalidInputError";
import * as model from "./profileModel";
import * as userModel from "./userModel";
import { EmailReminderPreference } from "./profileModel";
import { MongoMemoryServer } from "mongodb-memory-server";
let mongod : MongoMemoryServer;

const dbName = "profiles_db_test";
const userDbName = "users_db_test";

function generateProfileData(username: string): model.Profile {
    return {email: "Bob@gmail.com", username: username, isAdmin: false, coordinates: [10, 10], emailReminderPreference: "none"};
}

const strongPassword = "Abc123!@"
function generateUserData(): userModel.User {
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
    const url: string = mongod.getUri();
    try {
        await model.initialize(dbName, true, url);
        await userModel.initialize(userDbName, true, url); // ADD THIS LINE
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
    await userModel.close()
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
test('Success Add Profile', async () => {
    const newUser = generateUserData(); // creates a { username, password }
    await userModel.addUser(newUser.username, newUser.password);

    const newProfile: model.Profile = generateProfileData(newUser.username);
    await model.addProfile(
        newProfile.email,
        newProfile.isAdmin,
        newProfile.username,
        newProfile.coordinates,
        newProfile.emailReminderPreference
    );

    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);
    expect(results[0].username).toBe(newProfile.username);
    expect(results[0].email).toBe(newProfile.email);
    expect(results[0].isAdmin).toBe(newProfile.isAdmin);
    expect(results[0].coordinates).toEqual(newProfile.coordinates);
    expect(results[0].emailReminderPreference).toBe(newProfile.emailReminderPreference);
});


/**
 * Makes sure that we get an InvalidInputError when we try to add an invalid user.
 */
test('Fail Add Profile Non-existent User', async () => {
    const invalidProfile = generateProfileData("nonexistentUser");

    await expect(
        model.addProfile(
            invalidProfile.email,
            invalidProfile.isAdmin,
            invalidProfile.username,
            invalidProfile.coordinates,
            invalidProfile.emailReminderPreference
        )
    ).rejects.toThrow(InvalidInputError);
});

test('Fail Add Profile with Invalid Email Format', async () => {
    const user = generateUserData();
    await userModel.addUser(user.username, user.password);

    await expect(model.addProfile(
        "not-an-email",
        false,
        user.username,
        [10, 10],
        "none"
    )).rejects.toThrow(InvalidInputError);
});

test('Fail Add Profile with Missing Username', async () => {
    await expect(model.addProfile(
        "bob@gmail.com",
        false,
        "", // Missing username
        [10, 10],
        "none"
    )).rejects.toThrow(InvalidInputError);
});

test('Success getOneProfile returns profile by username', async () => {
    const user = generateUserData();
    await userModel.addUser(user.username, user.password);

    const profile = generateProfileData(user.username);
    await model.addProfile(
        profile.email,
        profile.isAdmin,
        profile.username,
        profile.coordinates,
        profile.emailReminderPreference
    );

    const fetchedProfile = await model.getOneProfile(user.username);
    expect(fetchedProfile).toBeDefined();
    expect(fetchedProfile.username).toBe(user.username);
    expect(fetchedProfile.email).toBe(profile.email);
});

test('Fail getOneProfile when profile does not exist', async () => {
    await expect(model.getOneProfile("nonexistentuser")).rejects.toThrow(InvalidInputError);
});

test('Success getAllProfiles returns all profiles', async () => {
    // Add two users and profiles
    const user1 = generateUserData();
    await userModel.addUser(user1.username, user1.password);
    const profile1 = generateProfileData(user1.username);
    await model.addProfile(
        profile1.email,
        profile1.isAdmin,
        profile1.username,
        profile1.coordinates,
        profile1.emailReminderPreference
    );

    await userModel.addUser("user2", strongPassword);
    const profile2 = generateProfileData("user2");
    await model.addProfile(
        profile2.email,
        profile2.isAdmin,
        profile2.username,
        profile2.coordinates,
        profile2.emailReminderPreference
    );

    const profiles = await model.getAllProfiles();
    expect(Array.isArray(profiles)).toBe(true);
    expect(profiles.length).toBe(2);

    const usernames = profiles.map(p => p.username);
    expect(usernames).toContain(user1.username);
    expect(usernames).toContain("user2");
});

test('getAllProfiles returns empty array when no profiles', async () => {
    const profiles = await model.getAllProfiles();
    expect(Array.isArray(profiles)).toBe(true);
    expect(profiles.length).toBe(0);
});

test('Success updateOneProfile updates an existing profile', async () => {
    const user = generateUserData();
    await userModel.addUser(user.username, user.password);
    const profile = generateProfileData(user.username);
    await model.addProfile(
        profile.email,
        profile.isAdmin,
        profile.username,
        profile.coordinates,
        profile.emailReminderPreference
    );

    const updatedProfile = {
        ...profile,
        email: "newemail@example.com",
        emailReminderPreference: "daily" as EmailReminderPreference,
    };

    const result = await model.updateOneProfile(profile.username, updatedProfile);
    expect(result.email).toBe(updatedProfile.email);
    expect(result.emailReminderPreference).toBe(updatedProfile.emailReminderPreference);

    const stored = await model.getOneProfile(profile.username);
    expect(stored.email).toBe(updatedProfile.email);
    expect(stored.emailReminderPreference).toBe(updatedProfile.emailReminderPreference);
});

test('Fail updateOneProfile throws InvalidInputError for invalid profile data', async () => {
    const user = generateUserData();
    await userModel.addUser(user.username, user.password);
    const profile = generateProfileData(user.username);
    await model.addProfile(
        profile.email,
        profile.isAdmin,
        profile.username,
        profile.coordinates,
        profile.emailReminderPreference
    );

    const invalidProfile = {
        ...profile,
        email: "invalid-email",  // invalid email
    };

    await expect(model.updateOneProfile(profile.username, invalidProfile)).rejects.toThrow(InvalidInputError);
});

test('Success deleteOneProfile deletes existing profile and user', async () => {
    const user = generateUserData();
    await userModel.addUser(user.username, user.password);
    const profile = generateProfileData(user.username);
    await model.addProfile(
        profile.email,
        profile.isAdmin,
        profile.username,
        profile.coordinates,
        profile.emailReminderPreference
    );

    const result = await model.deleteOneProfile(user.username);
    expect(result).toBe(true);

    // profile deleted
    const profiles = await model.getAllProfiles();
    expect(profiles.find(p => p.username === user.username)).toBeUndefined();

    // user deleted
    const usersCursor = await userModel.getCollection().find({ username: user.username });
    const users = await usersCursor.toArray();
    expect(users.length).toBe(0);
});

test('Fail deleteOneProfile throws InvalidInputError invalid username', async () => {
    await expect(model.deleteOneProfile("invalid-username")).rejects.toThrow(InvalidInputError);
});

test('Fail deleteOneProfile throws InvalidInputError not existing profile', async () => {
    const user = generateUserData();
    // Note: user not added to DB

    await expect(model.deleteOneProfile(user.username)).rejects.toThrow(InvalidInputError);
});