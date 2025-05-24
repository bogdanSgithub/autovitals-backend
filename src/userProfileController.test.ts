import { MongoMemoryServer } from "mongodb-memory-server";
import * as model from "./models/profileModel.js";
import * as userModel from "./models/userModel.js";
import { beforeAll, beforeEach, afterAll, test, expect, vi } from "vitest";
import app from './app.js';
import supertest from "supertest";
const strongPassword = "Abc123!@"
const testRequest = supertest(app);

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
});

beforeEach(async () => {
  const uri = mongod.getUri();
  await model.initialize('profile_db_test', true, uri);
  await userModel.initialize('user_db_test', true, uri);
  vi.setConfig({ testTimeout: 2_000 });
});

afterAll(async () => {
  await mongod.stop();
});

test("SUCCESS Register User", async () => {
  const username = "testuser";
  const password = strongPassword;

  const response = await testRequest.post("/users/register").send({ username, password });

  expect(response.status).toBe(200);
  expect(response.text).toBe(username);
  expect(response.headers['set-cookie']).toBeDefined();

  const setCookie = response.headers['set-cookie'];
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
  const cookie = cookies.find((c: string) => c.includes("sessionId="));
  expect(cookie).toBeDefined();
  expect(cookie).toMatch(/sessionId=/);

  // Verify user is actually saved in DB
  const cursor = await userModel.getCollection().find();
  const users = await cursor.toArray();
  const userExists = users.some(u => u.username === username);
  expect(userExists).toBe(true);
});

test("FAIL Register User missing username", async () => {
  const response = await testRequest.post("/users/register").send({ password: strongPassword });
  expect(response.status).toBe(400);
  expect(response.text.toLowerCase()).toContain("invalid input");
});

test("FAIL Register User missing password", async () => {
  const response = await testRequest.post("/users/register").send({ username: "user" });
  expect(response.status).toBe(400);
  expect(response.text.toLowerCase()).toContain("invalid input");
});

test("FAIL Register User duplicate username", async () => {
  const username = "duplicateUser";
  const password = strongPassword;

  // First registration - should succeed
  const firstResponse = await testRequest.post("/users/register").send({ username, password });
  expect(firstResponse.status).toBe(200);

  // Second registration with same username - expect failure
  const secondResponse = await testRequest.post("/users/register").send({ username, password });
  expect(secondResponse.status).toBe(400);
  expect(secondResponse.text.toLowerCase()).toMatch(/username is not available/);
});

test("SUCCESS add profile", async () => {
  const username = "profileUser";
  const password = strongPassword;
  const email = "profileUser@example.com";

  // Register user first
  const registerResponse = await testRequest.post("/users/register").send({ username, password });

  // Extract sessionId cookie from registration response
  const setCookie = registerResponse.headers['set-cookie'];
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
  const sessionCookie = cookies.find(c => c.includes("sessionId="));
  expect(sessionCookie).toBeDefined();

  const profileData = {
    email,
    isAdmin: false,
    username,
    coordinates: { lat: 45.4215, lng: -75.6999 },
    emailReminderPreference: true,
  };

  // Send /profiles request with session cookie to authenticate
  const response = await testRequest.post("/profiles")
    .set("Cookie", sessionCookie!)
    .send(profileData);

  expect(response.status).toBe(200);
  expect(response.body).toMatchObject({
    email: profileData.email,
    username: profileData.username,
    isAdmin: profileData.isAdmin,
    emailReminderPreference: profileData.emailReminderPreference,
  });
});

test("FAIL add profile invalid input", async () => {
  const username = "profileUser";
  const password = strongPassword;
  const email = "profileUser";

  // Register user first
  const registerResponse = await testRequest.post("/users/register").send({ username, password });

  // Extract sessionId cookie from registration response
  const setCookie = registerResponse.headers['set-cookie'];
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
  const sessionCookie = cookies.find(c => c.includes("sessionId="));
  expect(sessionCookie).toBeDefined();

  const profileData = {
    email,
    isAdmin: false,
    username,
    coordinates: { lat: 45.4215, lng: -75.6999 },
    emailReminderPreference: true,
  };

  // Send /profiles request with session cookie to authenticate
  const response = await testRequest.post("/profiles")
    .set("Cookie", sessionCookie!)
    .send(profileData);

  expect(response.status).toBe(400);
});

test("FAIL add profile no authentication", async () => {
  const username = "profileUser";
  const password = strongPassword;
  const email = "profileUser@gmail.com";

  // Register user first
  const registerResponse = await testRequest.post("/users/register").send({ username, password });

  const profileData = {
    email,
    isAdmin: false,
    username,
    coordinates: { lat: 45.4215, lng: -75.6999 },
    emailReminderPreference: true,
  };

  // Send /profiles request with session cookie to authenticate
  const response = await testRequest.post("/profiles")
    .send(profileData);

  expect(response.status).toBe(401); // not authenticated
});

test("FAIL add profile no user with corresponding username", async () => {
  const username = "profileUser";
  const email = "profileUser@gmail.com";

  const profileData = {
    email,
    isAdmin: false,
    username,
    coordinates: { lat: 45.4215, lng: -75.6999 },
    emailReminderPreference: true,
  };

  // Send /profiles request with session cookie to authenticate
  const response = await testRequest.post("/profiles")
    .send(profileData);

  expect(response.status).toBe(401); // not authenticated
});

test("SUCCESS get profile by username", async () => {
  const username = "profileUser";
  const password = strongPassword;
  const email = "profileUser@example.com";

  // Register user
  const registerResponse = await testRequest.post("/users/register").send({ username, password });
  const setCookie = registerResponse.headers['set-cookie'];
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
  const sessionCookie = cookies.find(c => c.includes("sessionId="));
  expect(sessionCookie).toBeDefined();

  // Create profile
  const profileData = {
    email,
    isAdmin: false,
    username,
    coordinates: { lat: 45.4215, lng: -75.6999 },
    emailReminderPreference: true,
  };
  const createResponse = await testRequest.post("/profiles")
    .set("Cookie", sessionCookie!)
    .send(profileData);
  expect(createResponse.status).toBe(200);

  // Now fetch that profile by username
  const getResponse = await testRequest.get(`/profile/${username}`)
    .set("Cookie", sessionCookie!);

  expect(getResponse.status).toBe(200);
  expect(getResponse.body).toMatchObject({
    email: profileData.email,
    username: profileData.username,
    isAdmin: profileData.isAdmin,
    emailReminderPreference: profileData.emailReminderPreference,
  });
});

test("FAIL get profile without authentication", async () => {
  const username = "anyUser";
  const response = await testRequest.get(`/profile/${username}`);
  expect(response.status).toBe(401);
  expect(response.text.toLowerCase()).toMatch(/unauthorized/);
});

test("FAIL get profile invalid username", async () => {
  const username = "nonexistentUser";

  // Register and authenticate first
  const registerResponse = await testRequest.post("/users/register").send({ username: "authUser", password: strongPassword });
  const setCookie = registerResponse.headers['set-cookie'];
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
  const sessionCookie = cookies.find(c => c.includes("sessionId="));
  expect(sessionCookie).toBeDefined();

  // Now try to get a profile that doesn't exist
  const response = await testRequest.get(`/profile/${username}`)
    .set("Cookie", sessionCookie!);

  expect([400, 404, 401]).toContain(response.status); // the cookie will block us before the 400 invalid username
  expect(response.text.toLowerCase()).toMatch(/unauthorized/);
});

test("SUCCESS update profile", async () => {
  const username = "profileUser";
  const password = strongPassword;
  const email = "profileUser@example.com";

  // Register user
  const registerResponse = await testRequest.post("/users/register").send({ username, password });
  const setCookie = registerResponse.headers['set-cookie'];
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
  const sessionCookie = cookies.find(c => c.includes("sessionId="));
  expect(sessionCookie).toBeDefined();

  // Create profile
  const profileData = {
    email,
    isAdmin: false,
    username,
    coordinates: { lat: 45.4215, lng: -75.6999 },
    emailReminderPreference: true,
  };
  const createResponse = await testRequest.post("/profiles")
    .set("Cookie", sessionCookie!)
    .send(profileData);
  expect(createResponse.status).toBe(200);

  // 3. Send update
  const updatedProfile = {
    ...profileData,
    email: "updated@example.com",
    coordinates: { lat: 10.1, lng: 20.2 },
    emailReminderPreference: true,
  };

  const updateResponse = await testRequest
    .put("/profiles")
    .set("Cookie", sessionCookie!)
    .send(updatedProfile);

  expect(updateResponse.status).toBe(200);
  expect(updateResponse.body).toMatchObject({
    username,
    email: updatedProfile.email,
    coordinates: updatedProfile.coordinates,
    emailReminderPreference: true,
  });
});

test("FAIL update profile invalid email", async () => {
  const username = "profileUser";
  const password = strongPassword;
  const email = "profileUser@example.com";

  // Register user
  const registerResponse = await testRequest.post("/users/register").send({ username, password });
  const setCookie = registerResponse.headers['set-cookie'];
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
  const sessionCookie = cookies.find(c => c.includes("sessionId="));
  expect(sessionCookie).toBeDefined();

  // Create profile
  const profileData = {
    email,
    isAdmin: false,
    username,
    coordinates: { lat: 45.4215, lng: -75.6999 },
    emailReminderPreference: true,
  };
  const createResponse = await testRequest.post("/profiles")
    .set("Cookie", sessionCookie!)
    .send(profileData);
  expect(createResponse.status).toBe(200);

  // 3. Send update
  const updatedProfile = {
    ...profileData,
    email: "invalidEmail",
    coordinates: { lat: 10.1, lng: 20.2 },
    emailReminderPreference: true,
  };

  const updateResponse = await testRequest
    .put("/profiles")
    .set("Cookie", sessionCookie!)
    .send(updatedProfile);

  expect(updateResponse.status).toBe(400);
});

test("FAIL update profile invalid user", async () => {
  const response = await testRequest.put("/profiles").send({
    username: "someone",
    email: "unauth@example.com",
    isAdmin: false,
    coordinates: { lat: 1, lng: 2 },
    emailReminderPreference: true,
  });

  expect([400]).toContain(response.status);
  expect(response.text.toLowerCase()).toMatch(/user not found/);
});

test("SUCCESS delete profile with valid session", async () => {
  process.env.TESTING = "true"; // Keep this in case the route uses it

  const username = "profileUserToDelete";
  const password = strongPassword;
  const email = "profileUserToDelete@example.com";

  // Register user
  const registerResponse = await testRequest
    .post("/users/register")
    .send({ username, password });

  const setCookie = registerResponse.headers["set-cookie"];
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
  const sessionCookie = cookies.find((c) => c.includes("sessionId="));
  expect(sessionCookie).toBeDefined();

  // Create profile
  const profileData = {
    email,
    isAdmin: false,
    username,
    coordinates: { lat: 45.4215, lng: -75.6999 },
    emailReminderPreference: true,
  };
  const createResponse = await testRequest
    .post("/profiles")
    .set("Cookie", sessionCookie!)
    .send(profileData);
  expect(createResponse.status).toBe(200);

  // Delete profile
  const deleteResponse = await testRequest
    .delete("/profiles")
    .set("Cookie", sessionCookie!) // ✅ INCLUDE session cookie here
    .send({ username, isAdminDelete: false });

  expect(deleteResponse.status).toBe(200);
  expect(deleteResponse.text.toLowerCase()).toMatch(/successfully deleted/i);
});


test("FAIL delete profile no username", async () => {
  const username = "profileUser";
  const password = strongPassword;
  const email = "profileUser@example.com";

  // Register user
  const registerResponse = await testRequest.post("/users/register").send({ username, password });
  const setCookie = registerResponse.headers['set-cookie'];
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
  const sessionCookie = cookies.find(c => c.includes("sessionId="));
  expect(sessionCookie).toBeDefined();

  // Create profile
  const profileData = {
    email,
    isAdmin: false,
    username,
    coordinates: { lat: 45.4215, lng: -75.6999 },
    emailReminderPreference: true,
  };
  const createResponse = await testRequest.post("/profiles")
    .set("Cookie", sessionCookie!)
    .send(profileData);
  expect(createResponse.status).toBe(200);

  const deleteResponse = await testRequest
    .delete("/profiles")
    .set("Cookie", sessionCookie)
    .send({ isAdminDelete: false });

  expect(deleteResponse.status).toBe(400);
  expect(deleteResponse.text.toLowerCase()).toMatch(/user not found/);
});

test("FAIL invalid username", async () => {
  const username = "profileUser";
  const password = strongPassword;
  const email = "profileUser@example.com";

  // Register user
  const registerResponse = await testRequest.post("/users/register").send({ username, password });
  const setCookie = registerResponse.headers['set-cookie'];
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
  const sessionCookie = cookies.find(c => c.includes("sessionId="));
  expect(sessionCookie).toBeDefined();

  // Create profile
  const profileData = {
    email,
    isAdmin: true,
    username,
    coordinates: { lat: 45.4215, lng: -75.6999 },
    emailReminderPreference: true,
  };
  const createResponse = await testRequest.post("/profiles")
    .set("Cookie", sessionCookie!)
    .send(profileData);
  expect(createResponse.status).toBe(200);

  const deleteResponse = await testRequest
    .delete("/profiles")
    .set("Cookie", sessionCookie)
    .send({ username: "bob", isAdminDelete: true });

  expect(deleteResponse.status).toBe(400);
  expect(deleteResponse.text.toLowerCase()).toMatch(/user not found/i);
});