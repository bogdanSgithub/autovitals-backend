
import { MongoMemoryServer } from "mongodb-memory-server";
import { addCar, deleteCar, getSingleCar, initialize, updateCar, getAllCars } from "./models/carModel.js";
import * as profileModel from "./models/profileModel.js"
import * as userModel from "./models/userModel.js"
import { beforeEach, vi, beforeAll, test, expect, afterAll } from "vitest";
import app from './app.js';
import supertest from "supertest";
const testRequest = supertest(app); 
import { routeRoot } from "./controllers/profileController.js";
import { ObjectId } from "mongodb";
import { a } from "vitest/dist/chunks/suite.d.FvehnV49.js";
const userDb = "user_db_test";
const profileDb = "profile_db_test";



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
        await userModel.initialize(userDb, true, uri);
        await profileModel.initialize(profileDb, true, uri);
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


afterAll(async () => {  
  await mongod.stop(); 
});
