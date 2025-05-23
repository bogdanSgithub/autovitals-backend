import { Request, Response } from 'express';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export function logVisit(req: Request, res: Response): string {
    let trackerId = (req as any).cookies?.trackerId;

    if (!trackerId) {
        trackerId = uuidv4();
        res.cookie('trackerId', trackerId, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year
            , sameSite: "none", secure: true
        });
    }

    const logEntry = `${new Date().toISOString()} | trackerId=${trackerId} | path=${req.originalUrl} | method=${req.method}\n`;
    fs.appendFile('./logs/visit.log', logEntry, err => {
        if (err) console.error('Log failed:', err);
    });

    return trackerId;
}