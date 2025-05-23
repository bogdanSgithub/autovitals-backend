//A decent part of this code is repurposed from the previous RestAPI lab.
import * as carModel from "./models/carModel.js"
import * as recordModel from "./models/maintenanceRecordModel.js"
import * as profileModel from "./models/profileModel.js"
import * as userModel from "./models/userModel.js"
import app from './app.js';

//this initiates the env variables
import * as dotenv from 'dotenv';

dotenv.config();


const port: number = 1339;
const url = `${process.env.URL_PRE}${process.env.MONGODB_PWD}${process.env.URL_POST}`


try{
  profileModel.initialize('profile_db', false, url)
  await recordModel.connectToDatabase()
  carModel.initialize('car_db', false, url)
  await userModel.initialize('user_db', false, url)

  await app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
  })
  
} catch (error: unknown){
  console.error(error)
}

  