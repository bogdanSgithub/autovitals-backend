import nodemailer from "nodemailer";
import * as dotenv from 'dotenv';
import { Profile } from "../models/profileModel";
import { getAllCarsForUser } from "../models/carModel";
import { getAllMaintenanceRecord } from "../models/maintenanceRecordModel";

dotenv.config();


const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_APP_PASSWORD
    },
    secure: true,
    port: 465
});

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
        await transporter.sendMail({
        from: process.env.EMAIL,
        to,
        subject,
        html,
        });
        console.log("✅ Email sent to", to);
    } catch (error) {
        console.error("❌ Failed to send email:", error);
    }
}