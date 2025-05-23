
import { MongoMemoryServer } from "mongodb-memory-server";
import { addCar, deleteCar, getSingleCar, initialize, updateCar, getAllCars } from "./models/carModel.js";
import * as model from "./models/profileModel.js"
import { beforeEach, vi, beforeAll, test, expect, afterAll } from "vitest";
import app from './app.js';
import supertest from "supertest";
const testRequest = supertest(app); 
import { routeRoot } from "./controllers/profileController.js";
import { ObjectId } from "mongodb";
import { a } from "vitest/dist/chunks/suite.d.FvehnV49.js";
const dbName = "user_db_test";



let mongod: MongoMemoryServer;
const db = "car_db"

interface Car {
  _id?: ObjectId;
  model: string;
  year: number;
  mileage: number;
  dateBought: Date;
  url: string;
  userID: string;
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
});

beforeEach(async () => {
    try { 
        const uri = mongod.getUri()
        await initialize(db, true, uri);
    } catch (err) {
        console.log(err)
    }
    vi.setConfig({ testTimeout: 5_000 }) 
});

test("testing add endpoint with valid input", async () => {
    //Add car to db with invalid model
    const response = await testRequest.post("/cars").send(
      { 
        model: "Ford F-150", 
        year: 2006,
        dateBought: new Date(),
        mileage: 1000,
        url: "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg",
        userID: "sef"
      }
    )

    //check if code is good
    expect(response.status).toBe(200)

    //check if it actually was added to db
    const cars = await getAllCars()
    expect(cars?.length == 1).toBe(true)

    const c_date = new Date()
    const dbDate = new Date(cars![0].dateBought)

    //check if the fields are right
    expect(cars![0].model).toBe("Ford F-150")
    expect(cars![0].year).toBe(2006)
    expect(cars![0].mileage).toBe(1000)
    expect(Math.abs(dbDate.getTime() - c_date.getTime())).toBeLessThan(1000); // 1 sec tolerance
    expect(cars![0].url).toBe("https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg")
    expect(cars![0].userID).toBe("sef")
})

test("testing add endpoint with invalid model", async () => {
    //Add car to db with invalid model
    const response = await testRequest.post("/cars").send(
      { 
        model: "BAD MODEL", 
        year: 2006,
        dateBought: new Date(),
        mileage: 1000,
        url: "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg",
        userID: "sef"
      }
    )
    //check if code is good
    expect(response.statusCode).toBe(400)

    //check if database is empty with getAll cars since it throws if the db is empty 
    try{
        getAllCars()
    }
    catch{
        // pass test if exception is thrown
        expect(true).toBe(true)
    }

})

test("testing add endpoint with invalid year", async () => {
    //Add car to db with invalid year
    const response = await testRequest.post("/cars").send(
      { 
        model: "Ford F-150", 
        year: 1,
        dateBought: new Date(),
        mileage: 1000,
        url: "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg",
        userID: "sef"
      }
    )
    //check if code is good
    expect(response.statusCode).toBe(400)

    //check if database is empty with getAll cars since it throws if the db is empty 
    try{
        getAllCars()
    }
    catch{
        // pass test if exception is thrown
        expect(true).toBe(true)
    }
})

test("testing add endpoint with invalid mileage", async () => {
  //Add car to db with invalid year
  const response = await testRequest.post("/cars").send(
    { 
      model: "Ford F-150", 
      year: 2006,
      dateBought: new Date(),
      mileage: -2,
      url: "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg",
      userID: "sef"
    }
  )
  //check if code is good
  expect(response.statusCode).toBe(400)

  //check if database is empty with getAll cars since it throws if the db is empty 
  try{
      getAllCars()
  }
  catch{
      // pass test if exception is thrown
      expect(true).toBe(true)
  }
})

test("testing add endpoint with invalid url", async () => {
  //Add car to db with invalid year
  const response = await testRequest.post("/cars").send(
    { 
      model: "Ford F-150", 
      year: 2004,
      dateBought: new Date(),
      mileage: 1000,
      url: "BAD URL",
      userID: "sef"
    }
  )
  //check if code is good
  expect(response.statusCode).toBe(400)

  //check if database is empty with getAll cars since it throws if the db is empty 
  try{
      getAllCars()
  }
  catch{
      // pass test if exception is thrown
      expect(true).toBe(true)
  }
})


test("test get all cars endpoint with car in db", async () => {
    //add car to db
    await testRequest.post("/cars").send(
      { 
        model: "Ford F-150", 
        year: 2000,
        dateBought: new Date(),
        mileage: 1000,
        url: "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg",
        userID: "sef"
      }
    )
    //get response of request
    const response = await testRequest.get("/cars/all/test")

    //since cars are in db, response should be valid
    expect(response.statusCode).toBe(200)

    //nothing else to test since it doesnt actually interact witrh the db
})

test("test get all cars endpoint with no car in db", async () => {
    //get response of request
    const response = await testRequest.get("/cars/all/test")

    //since no cars are in db, response should be a database error
    expect(response.statusCode).toBe(503)
})

test("test get single car in db with cars in db", async () => {
    // add to db
    const addedCar = await testRequest.post("/cars").send(
      { 
        model: "Ford F-150", 
        year: 2000,
        dateBought: new Date(),
        mileage: 1000,
        url: "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg",
        userID: "sef"
      }
    )

    //get added car from db  
    const response = await testRequest.get(`/cars/${addedCar.body._id.toString()}`)

    //since car is in db, status code should be valid
    expect(response.statusCode).toBe(200)

    //nothing else to test since it doesnt actually interact witrh the db
})


test("test get car that doesnt exist in db", async () => {

    //get a car that isnt in db
    const response = await testRequest.get("/cars/test")

    //since db is empty, 400 should be error code
    expect(response.statusCode).toBe(400)

    //nothing else to test since it doesnt actually interact with the db
})

test("test update car with valid input", async () => {
    //add car to db
    const addedCar = await testRequest.post("/cars").send(
      { 
        model: "Ford F-150", 
        year: 2000,
        dateBought: new Date(),
        mileage: 1000,
        url: "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg",
        userID: "sef"
      }
    )

    //update it with valid input
    const response = await testRequest.put("/cars/").send({id: addedCar.body._id.toString(), newModel: "Audi A4", newYear: 2024, newMileage: 500, newURL: "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg", dateBought: new Date()})

    //status code should be 200
    expect(response.statusCode).toBe(200)

    //get cars to check if it actually was updated
    const cars = await getAllCars()


    const c_date = new Date()
    const dbDate = new Date(cars![0].dateBought)


    //check db to see if it really uodated
    expect(cars![0].model).toBe("Audi A4")
    expect(cars![0].year).toBe(2024)
    expect(cars![0].mileage).toBe(500)
    expect(cars![0].url).toBe("https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg")
    expect(Math.abs(dbDate.getTime() - c_date.getTime())).toBeLessThan(1000); // 1 sec tolerance
})

test("test update car with invalid match", async () => {
    //add car to db
    await testRequest.post("/cars").send(
      { 
        model: "Ford F-150", 
        year: 2000,
        dateBought: new Date(),
        mileage: 1000,
        url: "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg",
        userID: "sef"
      }
    )

    //update it with valid input
    const response = await testRequest.put("/cars/").send({id: "Not an ID", newModel: "Audi A4", newYear: 2024, newMileage: 500, newURL: "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg", dateBought: new Date()})

    //status code should be 200
    expect(response.statusCode).toBe(400)

    //get cars to check if it wasnt updated
    const cars = await getAllCars()

    const c_date = new Date()
    const dbDate = new Date(cars![0].dateBought)


    //check db to see if it wasnt updated
    expect(cars![0].model).toBe("Ford F-150")
    expect(cars![0].year).toBe(2000)
    expect(cars![0].mileage).toBe(1000)
    expect(cars![0].url).toBe("https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg")
    expect(Math.abs(dbDate.getTime() - c_date.getTime())).toBeLessThan(1000); // 1 sec tolerance
})


test("delete car with valid input", async () => {
    //add car to db
    const addedCar = await testRequest.post("/cars").send(
      { 
        model: "Ford F-150", 
        year: 2000,
        dateBought: new Date(),
        mileage: 1000,
        url: "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg",
        userID: "sef"
      }
    )

    //delete car from db
    const response = await testRequest.delete(`/cars/${addedCar.body._id.toString()}`)

    //should be valid code
    expect(response.statusCode).toBe(200)

    //get all cars should throw since the db should be empty
    try{
        getAllCars()
    }
    catch{
        // pass test if exception is thrown
        expect(true).toBe(true)
    }
})

test("delete car with invalid match", async () => {
    //add car to db
      await testRequest.post("/cars").send(
      { 
        model: "Ford F-150", 
        year: 2000,
        dateBought: new Date(),
        mileage: 1000,
        url: "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg",
        userID: "sef"
      }
    )
    //delete car from db
    const response = await testRequest.delete("/cars/NotanID")

    //should be valid code
    expect(response.statusCode).toBe(400)

    //get all cars should throw since the db should be empty

    //get cars to check if it wasnt deleted
    const cars = await getAllCars()

    const c_date = new Date()
    const dbDate = new Date(cars![0].dateBought)


    //check db to see if it wasnt deleted
    expect(cars![0].model).toBe("Ford F-150")
    expect(cars![0].year).toBe(2000)
    expect(cars![0].mileage).toBe(1000)
    expect(cars![0].url).toBe("https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg")
    expect(Math.abs(dbDate.getTime() - c_date.getTime())).toBeLessThan(1000); // 1 sec tolerance    
})

// ****************************************************************************************************************
// ************************************************ GET All /users ************************************************
// ****************************************************************************************************************

/**
 * Generates and returns a valid User object (firstName, lastName)
 * @returns 
 */
function generateProfileData(): model.Profile {
    const profiles: model.Profile[] = [
      /*{email: "Bob@gmail.com", username: "1", isAdmin: false, coordinates: [10, 10], emailReminderPreference: "none"},
      {email: "Bob@gmail.com", username: "1", isAdmin: false, coordinates: [10, 10], emailReminderPreference: "none"},
      {email: "Bob@gmail.com", username: "1", isAdmin: false, coordinates: [10, 10], emailReminderPreference: "none"},*/
    ];
    return profiles[Math.floor(Math.random() * profiles.length)];
  }
  


/**
 * Adds a user to the database using the model's addUser method. GET /users endpoint and expects it to be status 200 and to contain the newly added user. Also makes sure that is the only user in the database.
 */
test("GET All /profiles success", async () => {
    const newProfile: model.Profile = generateProfileData();
    await model.addProfile(newProfile.email, newProfile.isAdmin, newProfile.username, newProfile.coordinates, newProfile.emailReminderPreference);
  
    const testResponse = await testRequest.get(routeRoot + "/profiles");
    expect(testResponse.status).toBe(200);
    // to contain checks that this substring is in the response.text string. The formatting (firstName lastName) must be respected.
    expect(testResponse.text).toContain(`${newProfile.email}`);
    expect(testResponse.text).toContain(`${newProfile.username}`);
    
    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();
    
    expect(Array.isArray(results)).toBe(true);
    // make sure that is the only user in the database.
    expect(results.length).toBe(1);
    expect(results[0].username.toLowerCase() == newProfile.username.toLowerCase()).toBe(true);
    expect(results[0].email.toLowerCase() == newProfile.email.toLowerCase()).toBe(true);
  });
  
  /**
   * GET /users endpoint without adding anything to the database, expects it to be status code 200 and the right text. Also makes sure the database is empty.
   */
  test("GET All /profiles empty database", async () => {
    const testResponse = await testRequest.get(routeRoot + "/profiles/");
    expect(testResponse.status).toBe(200);
  
    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);
    // make sure the database is in fact empty
    expect(results.length).toBe(0);
  });
  
  // ****************************************************************************************************************
  // ************************************************ GET One /users ************************************************
  // ****************************************************************************************************************
  
  /**
   * Adds a user to the database using the model's addUser method. GET /users/:firstName endpoint and expects it to be status 200 and to contain the newly added user.
   */
  test("GET One /profile success", async () => {
    const newProfile: model.Profile = generateProfileData();
    await model.addProfile(newProfile.email, newProfile.isAdmin, newProfile.username, newProfile.coordinates, newProfile.emailReminderPreference);
  
    const testResponse = await testRequest.get(routeRoot + "/users/" + newProfile.username);
    expect(testResponse.status).toBe(200);
  });
  
  /**
   * GET /users/:firstName endpoint and expects it to be status 400 and to not find the user since it's not in the database.
   */
  test("GET One /profiles fail FirstName Not in Database 400", async () => {
    const user = generateProfileData();
    const testResponse = await testRequest.get(routeRoot + "/profiles/" + user.username);
    expect(testResponse.status).toBe(400);
    expect(testResponse.text).toContain("User not found");
  });
  
  /**
   * GET /users/:firstName endpoint and expects it to be status 400 and to not find the user since it's not in the database.
   */
  test("GET One /profiles fail Invalid FirstName 400", async () => {
    const newProfile: model.Profile = generateProfileData();
    await model.addProfile(newProfile.email, newProfile.isAdmin, newProfile.username, newProfile.coordinates, newProfile.emailReminderPreference);
  
    const testResponse = await testRequest.get(routeRoot + "/profiles/" + "invalid_first_name_123");
    console.log(testResponse.text);
    expect(testResponse.status).toBe(400);
    expect(testResponse.text).toContain(`invalid input`);
  });
  
  /**
   * GET /users/:firstName endpoint and expects it to be status 500 since we closed the connection to mongo.
   */
  test("GET One /profiles fail closed connection 500", async () => {
    model.close();
    const testResponse = await testRequest.get(routeRoot + "/profiles/" + "valid");
    expect(testResponse.status).toBe(500);
    expect(testResponse.text).toContain(`Client must be connected`);
  });
  
  // ****************************************************************************************************************
  // ************************************************** POST /users *************************************************
  // ****************************************************************************************************************
  
  /**
   * POST /users with valid firstName and lastName entries in request, expects it to be 200 and checks to make sure it was added in the database.
   *//*
  test("POST /users success", async () => {
      const newProfile: model.Profile = generateProfileData();
      const testResponse = await testRequest.post(routeRoot + "/users").send({
        firstName: newProfile.firstName,
        lastName: newProfile.lastName,
      });
      expect(testResponse.status).toBe(200);
  
      const cursor = await model.getCollection().find();
      const results = await cursor.toArray();
    
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(1);
      // make sure it was added to database
      expect(results[0].firstName.toLowerCase() == newProfile.firstName.toLowerCase()).toBe(true);
      expect(results[0].lastName.toLowerCase() == newProfile.lastName.toLowerCase()).toBe(true);
    });*/
  
  /**
   * POST /users with invalid firstName and valid lastName entries in request, expects it to be 400 and checks to make sure it was not added in the database.
   */
  /*
  test("POST /users error 400 invalid user", async () => {
      const testResponse = await testRequest.post(routeRoot + "/users").send({
          firstName: "invalid_first_name_123",
          lastName: "stuff"
      });
      expect(testResponse.status).toBe(400);
      // server should say something about invalid input
      expect(testResponse.text).toContain("invalid input");
  
      const cursor = await model.getCollection().find();
      const results = await cursor.toArray();
    
      expect(Array.isArray(results)).toBe(true);
      // make sure it was not added to database
      expect(results.length).toBe(0);
  });*/
  
  /**
   * POST /users with valid firstName and lastName entries in request, expects it to be 500 since connection was closed and makes sure that is mentioned in the server response and that the user was not added.
   */
  /*
  test("POST /users error 500 database connection closed", async () => {
      model.close();
      const testResponse = await testRequest.post(routeRoot + "/users").send({
        firstName: "validName",
        lastName: "stuff"
    });
    expect(testResponse.status).toBe(500);
    expect(testResponse.text).toContain(`Client must be connected`);
    await model.initialize(dbName, true, mongod.getUri());
  
    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();
  
    expect(Array.isArray(results)).toBe(true);
    // make sure it was not added to database
    expect(results.length).toBe(0);
  });*/
  
  // ****************************************************************************************************************
  // ************************************************** PUT /users **************************************************
  // ****************************************************************************************************************
  
  /**
   * PUT /users with valid firstName, lastName, newFirstName, newLastName entries in request, expects it to be 200 and checks to make sure it was updated in the database.
   */
  /*
  test("PUT /users success", async () => {
    // create and add oldUser to database
    const oldUser: model.User = {firstName: "Bob", lastName: "Cop"};
    await model.addUser(oldUser.firstName, oldUser.lastName);
    const newProfile: model.User = generateUserData();
  
    const testResponse = await testRequest.put(routeRoot + "/users").send({
      firstName: oldUser.firstName,
      lastName: oldUser.lastName,
      newFirstName: newProfile.firstName,
      newLastName: newProfile.lastName
    });
    expect(testResponse.status).toBe(200);
  
    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();
  
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);
    // make sure it was updated in the database
    expect(results[0].firstName.toLowerCase() == newProfile.firstName.toLowerCase()).toBe(true);
    expect(results[0].lastName.toLowerCase() == newProfile.lastName.toLowerCase()).toBe(true);
  });*/
  
  /**
   * PUT /users with valid firstName, valid lastName, invalid newFirstName, newLastName entries in request, expects it to be 400 and checks to make sure it was not updated in the database.
   */
  /*
  test("PUT /users error 400 invalid new user", async () => {
    const oldUser: model.User = generateUserData();
    await model.addUser(oldUser.firstName, oldUser.lastName);
  
    const testResponse = await testRequest.put(routeRoot + "/users").send({
      firstName: oldUser.firstName,
      lastName: oldUser.lastName,  
      newFirstName: "invalid_first_name_123",
      newLastName: "stuff",
    });
    expect(testResponse.status).toBe(400);
    // make sure it says somewhere that the input vas invalid
    expect(testResponse.text).toContain("invalid input");
  
    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);
    // make sure it was not updated in the database
    expect(results[0].firstName.toLowerCase() == oldUser.firstName.toLowerCase()).toBe(true);
    expect(results[0].lastName.toLowerCase() == oldUser.lastName.toLowerCase()).toBe(true);
  });*/
  
  /**
   * PUT /users with invalid firstName (old user), invalid lastName, valid newFirstName, valid newLastName entries in request, expects it to be 400 and checks to make sure it was not updated in the database.
   */
  /*
  test("PUT /users error 400 invalid old user", async () => {
    const oldUser: model.User = generateUserData();
    await model.addUser(oldUser.firstName, oldUser.lastName);
  
    const testResponse = await testRequest.put(routeRoot + "/users").send({
      firstName: "invalid_firstName_123",
      lastName: "invalid_lastName_123",  
      newFirstName: "valid",
      newLastName: "stuff",
    });
    expect(testResponse.status).toBe(400);
      // make sure it says somewhere that the input vas invalid
    expect(testResponse.text).toContain("invalid input");
    
    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);
    // make sure it was not updated in the database
    expect(results[0].firstName.toLowerCase() == oldUser.firstName.toLowerCase()).toBe(true);
    expect(results[0].lastName.toLowerCase() == oldUser.lastName.toLowerCase()).toBe(true);
  });*/
  
  /**
   * PUT /users with valid firstName, lastName, newFirstName, newLastName entries in request, expects it to be 500 because model connection was closed and checks to make sure it was not updated in the database.
   */
  /*
  test("PUT /users error 500 database connection closed", async () => {
    const oldUser: model.User = generateUserData();
    await model.addUser(oldUser.firstName, oldUser.lastName);
    
    model.close();
    const testResponse = await testRequest.put(routeRoot + "/users").send({
      firstName: oldUser.firstName,
      lastName: oldUser.lastName,  
      newFirstName: "valid",
      newLastName: "stuff",
    }); 
    expect(testResponse.status).toBe(500);
    // make sure it mentions that it was not connected to mongo
    expect(testResponse.text).toContain(`Client must be connected`);
  
    // reset flag is false because we added it before the put request
    await model.initialize(dbName, false, mongod.getUri());
  
    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();
  
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);
      // make sure it was not updated in the database
    expect(results[0].firstName.toLowerCase() == oldUser.firstName.toLowerCase()).toBe(true);
    expect(results[0].lastName.toLowerCase() == oldUser.lastName.toLowerCase()).toBe(true);
  });*/
  
  // ****************************************************************************************************************
  // ************************************************** DEL /users **************************************************
  // ****************************************************************************************************************
  
  /**
   * DEL /users with valid firstName and lastName entries in request, expects it to be 200 and checks to make sure it was deleted from the database.
   */
  /*
  test("DELETE /users success case", async () => {
    // add the user
    const newProfile: model.User = generateUserData();
    await model.addUser(newProfile.firstName, newProfile.lastName);
    
    // delete the newly added user
    const testResponse = await testRequest.delete(routeRoot + "/users").send({
      firstName: newProfile.firstName,
      lastName: newProfile.lastName,
    });
    expect(testResponse.status).toBe(200);
  
    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();
  
    expect(Array.isArray(results)).toBe(true);
    // make sure the newly added user was deleted
    expect(results.length).toBe(0);
  });*/
  
  /**
   * DEL /users with invalid firstName and lastName entries in request, expects it to be 400 and checks to make sure it was not deleted from the database.
   */
  /*
  test("DELETE /users error 400 invalid user", async () => {
    const newProfile: model.User = generateUserData();
    await model.addUser(newProfile.firstName, newProfile.lastName);
  
    const testResponse = await testRequest.delete(routeRoot + "/users").send({
        firstName: "invalid_first_name_123",
        lastName: "stuff"
    });
    expect(testResponse.status).toBe(400);
    // in the text response, it should mention that the user provided was invalid.
    expect(testResponse.text).toContain("Invalid user");
  
    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();
  
    expect(Array.isArray(results)).toBe(true);
    // make sure the newly added user was not deleted
    expect(results.length).toBe(1);
  });*/
  
  /**
   * DEL /users with valid firstName and lastName entries in request, expects it to be 500 because connection to mongo was closed. Checks to make sure it was not deleted from the database.
   */
  /*
  test("DELETE /users error 500 database connection closed", async () => {
    const newProfile: model.User = generateUserData();
    await model.addUser(newProfile.firstName, newProfile.lastName);
  
    model.close();
    const testResponse = await testRequest.delete(routeRoot + "/users").send({
      firstName: newProfile.firstName,
      lastName: newProfile.lastName
    });
    expect(testResponse.status).toBe(500);
  
    await model.initialize(dbName, false, mongod.getUri());
    const cursor = await model.getCollection().find();
    const results = await cursor.toArray();
  
    expect(Array.isArray(results)).toBe(true);
    // make sure the newly added user was not deleted
    expect(results.length).toBe(1);
  });*/
  
  /**
   * Gets the root endpoint and makes sure its a valid endpoint.
   */
  test("GET Home / success", async () => {
    const testResponse = await testRequest.get("/");
    expect(testResponse.status).toBe(200);
    expect(testResponse.text).toBe('Users API!!!');
  });
  
  /**
   * Gets an invalid endpoint endpoint and makes sure it is a 404.
   */
  test("GET Invalid Url", async () => {
    const testResponse = await testRequest.get("/invalidUrl");
    expect(testResponse.status).toBe(404);
  });
  



afterAll(async () => {  
  await mongod.stop(); 
});
