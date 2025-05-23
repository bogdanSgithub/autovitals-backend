import nodemailer from "nodemailer";
import * as dotenv from 'dotenv';
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
export async function sendEmail(to, subject, html) {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL,
            to,
            subject,
            html,
        });
        console.log("✅ Email sent to", to);
    }
    catch (error) {
        console.error("❌ Failed to send email:", error);
    }
}
//# sourceMappingURL=emailSender.js.map