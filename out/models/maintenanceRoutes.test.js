"use strict";
// import supertest from 'supertest';
// import { MongoMemoryServer } from 'mongodb-memory-server';
// import { MongoClient } from 'mongodb';
// import MaintenanceRecord from '../models/maintenanceRecords'; // Fix import if needed
// const request = supertest('http://localhost:3000');
// let mongoServer: MongoMemoryServer;
// let client: MongoClient;
// // POST success
// test('POST /api/maintenance success case', async () => {
//   const testRecord: MaintenanceRecord = {
//     carPart: 'engine',
//     lastChanged: new Date('2023-01-01').toISOString(),
//     nextChange: new Date('2024-01-01').toISOString(),
//     mileage: '10000',
//   };
//   const response = await request.post('/api/maintenance').send(testRecord);
//   expect(response.body).not.toBeNull();
//   expect(response.body.carPart).toBe('engine');
// });
// // POST failure
// test('POST /api/maintenance failure case', async () => {
//   const invalidRecord: MaintenanceRecord = {
//     carPart: '',
//     lastChanged: new Date('2023-01-01').toISOString(),
//     nextChange: new Date('2024-01-01').toISOString(),
//     mileage: '5000',
//   };
//   const response = await request.post('/api/maintenance').send(invalidRecord);
//   expect(response.body).toBeNull();
// });
// // GET one success
// test('GET /api/maintenance/:carPart success case', async () => {
//   const testRecord: MaintenanceRecord = {
//     carPart: 'airbags',
//     lastChanged: new Date('2023-01-01').toISOString(),
//     nextChange: new Date('2024-01-01').toISOString(),
//     mileage: '20000',
//   };
//   await request.post('/api/maintenance').send(testRecord);
//   const response = await request.get('/api/maintenance/airbags');
//   expect(response.body).not.toBeNull();
//   expect(response.body.carPart).toBe('airbags');
//   expect(new Date(response.body.lastChanged)).toEqual(new Date('2023-01-01T00:00:00.000Z'));
//   expect(new Date(response.body.nextChange)).toEqual(new Date('2024-01-01T00:00:00.000Z'));
// });
// // GET one failure
// test('GET /api/maintenance/:carPart failure case', async () => {
//   const response = await request.get('/api/maintenance/nonexistentpart');
//   expect(response.body).toBeNull();
// });
// // GET all success
// test('GET /api/maintenance success case', async () => {
//   const testRecord1: MaintenanceRecord = {
//     carPart: 'airbags',
//     lastChanged: new Date('2023-01-01').toISOString(),
//     nextChange: new Date('2024-01-01').toISOString(),
//     mileage: '15000',
//   };
//   const testRecord2: MaintenanceRecord = {
//     carPart: 'oilchange',
//     lastChanged: new Date('2023-01-05').toISOString(),
//     nextChange: new Date('2024-01-05').toISOString(),
//     mileage: '16000',
//   };
//   await request.post('/api/maintenance').send(testRecord1);
//   await request.post('/api/maintenance').send(testRecord2);
//   const response = await request.get('/api/maintenance');
//   const allRecords = response.body;
//   expect(allRecords.length).toBe(2);
//   expect(allRecords[0].carPart).toBe('airbags');
//   expect(allRecords[1].carPart).toBe('oilchange');
// });
// // GET all empty case
// test('GET /api/maintenance empty case', async () => {
//   const response = await request.get('/api/maintenance');
//   expect(response.body.length).toBe(0);
// });
// // DELETE success
// test('DELETE /api/maintenance/:carPart success case', async () => {
//   const testRecord: MaintenanceRecord = {
//     carPart: 'airbags',
//     lastChanged: new Date('2023-01-01').toISOString(),
//     nextChange: new Date('2024-01-01').toISOString(),
//     mileage: '13000',
//   };
//   await request.post('/api/maintenance').send(testRecord);
//   await request.delete('/api/maintenance/airbags');
//   const response = await request.get('/api/maintenance/airbags');
//   expect(response.body).toBeNull();
//   const allRecordsResponse = await request.get('/api/maintenance');
//   expect(allRecordsResponse.body.length).toBe(0);
// });
// // DELETE failure
// test('DELETE /api/maintenance/:carPart failure case', async () => {
//   const response = await request.delete('/api/maintenance/nonexistentpart');
//   expect(response.status).toBe(404); // Expect a 404 for non-existent delete
// });
//# sourceMappingURL=maintenanceRoutes.test.js.map