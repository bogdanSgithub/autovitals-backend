import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
export function logVisit(req, res) {
    let trackerId = req.cookies?.trackerId;
    if (!trackerId) {
        trackerId = uuidv4();
        res.cookie('trackerId', trackerId, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year
        });
    }
    const logEntry = `${new Date().toISOString()} | trackerId=${trackerId} | path=${req.originalUrl} | method=${req.method}\n`;
    fs.appendFile('./logs/visit.log', logEntry, err => {
        if (err)
            console.error('Log failed:', err);
    });
    return trackerId;
}
//# sourceMappingURL=loggerHelper.js.map