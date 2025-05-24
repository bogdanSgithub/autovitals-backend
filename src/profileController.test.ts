import { MongoMemoryServer } from "mongodb-memory-server";
import * as model from "./models/profileModel.js";
import { beforeAll, beforeEach, afterAll, test, expect, vi } from "vitest";
import app from './app.js';
import supertest from "supertest";
const testRequest = supertest(app);

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
});

beforeEach(async () => {
  const uri = mongod.getUri();
  await model.initialize('profile_db_test', true, uri);
  vi.setConfig({ testTimeout: 5_000 });
});

afterAll(async () => {
  await mongod.stop();
});

test("POST /profiles successfully adds a profile", async () => {
  const newProfile = {
    email: "test@example.com",
    isAdmin: false,
    username: "testuser",
    coordinates: { lat: 12.34, lng: 56.78 },
    emailReminderPreference: true
  };

  const response = await testRequest.post("/profiles").send(newProfile);

  expect(response.status).toBe(200);
  expect(response.body.email).toBe(newProfile.email);
  expect(response.body.username).toBe(newProfile.username);

  // Optionally, verify data directly from DB if model exposes a get method
  const profiles = await model.getAllProfiles();
  expect(profiles.length).toBe(1);
  expect(profiles[0].email).toBe(newProfile.email);
});

test("POST /profiles returns 400 on invalid input", async () => {
  const badProfile = {
    email: "",  // assuming empty email triggers InvalidInputError in your model
    isAdmin: false,
    username: "",
    coordinates: {},
    emailReminderPreference: false
  };

  const response = await testRequest.post("/profiles").send(badProfile);

  expect(response.status).toBe(400);
  expect(response.text).toContain("invalid input");
});
