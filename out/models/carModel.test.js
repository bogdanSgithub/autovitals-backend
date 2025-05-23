import { MongoMemoryServer } from "mongodb-memory-server";
import { addCar, deleteCar, getAllCars, getSingleCar, initialize, updateCar } from "./carModel.js";
import { beforeEach, vi, beforeAll, test, expect, afterAll } from "vitest";
let mongod;
const db = "car_db";
beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
});
beforeEach(async () => {
    try {
        const uri = mongod.getUri();
        await initialize(db, true, uri);
    }
    catch (err) {
        console.log(err);
    }
    vi.setConfig({ testTimeout: 5_000 });
});
test("adding one valid car to database", async () => {
    const testCar = { model: "Honda Civic", year: 2006, mileage: 2, dateBought: new Date(), url: "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg", userID: "sef" };
    await addCar(testCar.model, testCar.year, testCar.mileage, testCar.dateBought, testCar.url, testCar.userID);
    const cars = await getAllCars();
    console.log("THIS IS CARS: " + cars[0].dateBought);
    expect(cars.length == 1).toBe(true);
    expect(cars[0].model == testCar.model && cars[0].year == testCar.year && cars[0].mileage == testCar.mileage && cars[0].dateBought.getTime() == testCar.dateBought.getTime() && cars[0].userID == testCar.userID && cars[0].url == testCar.url).toBe(true);
});
test("adding multiple valid cars to database", async () => {
    const testCar = { model: "Honda Civic", year: 2006, mileage: 2, dateBought: new Date(), url: "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg", userID: "sef" };
    const testCar2 = { model: "Ford F-150", year: 2004, mileage: 2, dateBought: new Date(), url: "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg", userID: "sef" };
    await addCar(testCar.model, testCar.year, testCar.mileage, testCar.dateBought, testCar.url, testCar.userID);
    await addCar(testCar2.model, testCar2.year, testCar2.mileage, testCar2.dateBought, testCar2.url, testCar2.userID);
    const cars = await getAllCars();
    expect(cars.length == 2).toBe(true);
    expect(cars[0].model == testCar.model && cars[0].year == testCar.year && cars[0].mileage == testCar.mileage && cars[0].dateBought.getTime() == testCar.dateBought.getTime() && cars[0].userID == testCar.userID && cars[0].url == testCar.url).toBe(true);
    expect(cars[1].model == testCar2.model && cars[1].year == testCar2.year && cars[1].mileage == testCar2.mileage && cars[1].dateBought.getTime() == testCar2.dateBought.getTime() && cars[1].userID == testCar2.userID && cars[1].url == testCar2.url).toBe(true);
});
test("adding car with invalid model", async () => {
    const testCar = { model: "Civiv not Honda", year: 2006, mileage: 2, dateBought: new Date(), url: "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg", userID: "sef" };
    expect(async () => {
        await addCar(testCar.model, testCar.year, testCar.mileage, testCar.dateBought, testCar.url, testCar.userID);
    }).rejects.toThrow();
});
test("adding car with invalid year", async () => {
    const testCar = { model: "Honda Civic", year: 1989, mileage: 2, dateBought: new Date(), url: "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg", userID: "sef" }; //this also tests the edge case
    expect(async () => {
        await addCar(testCar.model, testCar.year, testCar.mileage, testCar.dateBought, testCar.url, testCar.userID);
    }).rejects.toThrow();
});
test("reading single car from db", async () => {
    const testCar = { model: "Honda Civic", year: 2006, mileage: 2, dateBought: new Date(), url: "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg", userID: "sef" };
    const addedCar = await addCar(testCar.model, testCar.year, testCar.mileage, testCar.dateBought, testCar.url, testCar.userID);
    const retrivedCar = await getSingleCar(addedCar._id?.toString());
    expect(testCar.model == retrivedCar?.model && testCar.year == retrivedCar.year).toBe(true);
});
test("reading car that doesn't exist in db", async () => {
    expect(async () => {
        await getSingleCar("BAD ID");
    }).rejects.toThrow();
});
test("read all cars with cars in db", async () => {
    const testCar = { model: "Honda Civic", year: 2006, mileage: 2, dateBought: new Date(), url: "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg", userID: "sef" };
    const testCar2 = { model: "Ford F-150", year: 2004, mileage: 2, dateBought: new Date(), url: "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg", userID: "sef" };
    await addCar(testCar.model, testCar.year, testCar.mileage, testCar.dateBought, testCar.url, testCar.userID);
    await addCar(testCar2.model, testCar2.year, testCar2.mileage, testCar2.dateBought, testCar2.url, testCar2.userID);
    const cars = await getAllCars();
    expect(cars.length == 2).toBe(true);
});
test("read all cars with no cars in db", async () => {
    expect(async () => {
        await getAllCars();
    }).rejects.toThrow();
});
test("updating car with valid args", async () => {
    const testCar = { model: "Honda Civic", year: 2006, mileage: 1, dateBought: new Date(), url: "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg", userID: "sef" };
    const updatedCar = { model: "Toyota Camry", year: 2022, mileage: 1, dateBought: new Date(), url: "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg", userID: "sef" };
    const addedCar = await addCar(testCar.model, testCar.year, testCar.mileage, testCar.dateBought, testCar.url, testCar.userID);
    await updateCar(addedCar._id?.toString(), updatedCar.model, updatedCar.year, updatedCar.mileage, updatedCar.url, updatedCar.dateBought);
    const dbUpdatedCar = await getSingleCar(addedCar._id?.toString());
    expect(testCar != dbUpdatedCar).toBe(true);
    expect(dbUpdatedCar?.model == updatedCar.model && dbUpdatedCar.year == updatedCar.year).toBe(true);
});
test("trying to update car that doesnt exist in db.", async () => {
    expect(async () => {
        await updateCar("BAD ID", "Toyota Camry", 2022, 0, "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg", new Date());
    }).rejects.toThrow();
});
test("trying to update car with invalid new name", async () => {
    const updatedCar = { model: "Camry", year: 2022, mileage: 1, dateBought: new Date(), url: "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg", userID: "sef" };
    expect(async () => {
        await updateCar("bad id", updatedCar.model, updatedCar.year, updatedCar.mileage, updatedCar.url, updatedCar.dateBought);
    }).rejects.toThrow();
});
test("trying to update car with invalid new year", async () => {
    const updatedCar = { model: "Toyota Camry", year: 1, mileage: 1, dateBought: new Date(), url: "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg", userID: "sef" };
    expect(async () => {
        await updateCar("bad id", updatedCar.model, updatedCar.year, updatedCar.mileage, updatedCar.url, updatedCar.dateBought);
    }).rejects.toThrow();
});
test("deleting from db with valid args", async () => {
    const testCar = { model: "Honda Civic", year: 2006, mileage: 1, dateBought: new Date(), url: "https://img.sm360.ca/ir/w640/images/newcar/ca/2025/honda/civic-berline-hybride/sport/sedan/2025_honda_civic-sedan-hybride_sport_photos_002.jpg", userID: "sef" };
    const addedCar = await addCar(testCar.model, testCar.year, testCar.mileage, testCar.dateBought, testCar.url, testCar.userID);
    await deleteCar(addedCar._id?.toString());
    // getSingleCar should throw since car doesnt exist anymore
    expect(async () => {
        await getSingleCar(addedCar._id?.toString());
    }).rejects.toThrow();
});
test("deleting car that doesnt exist in the db", async () => {
    expect(async () => {
        await deleteCar("BAD ID");
    }).rejects.toThrow();
});
afterAll(async () => {
    await mongod.stop();
});
//# sourceMappingURL=carModel.test.js.map