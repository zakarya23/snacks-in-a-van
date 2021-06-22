const { response } = require('express');
const request = require('supertest');
const app = require('../src/app');

jest.setTimeout(10000);

describe('Integration test: Setting van status in vendor app', () => {
    let agent = request.agent(app);

    let cookie = null;


    beforeAll(() => agent 
        // post request to login
        .post('/vendor/')

        .set('Content-Type', 'application/x-www-form-urlencoded')

        // send name and password
        .send({
            name: 'Chow Chariot',
            password: 'password',
        })
        
        // gets cookie and stores in a variable
        .then((res) => {
            cookie = res
               .headers['set-cookie'][0]
               .split(',')
               .map(item => item.split(';')[0])
               .join(';')
        })
    );
    

    // Test Case 1: Vendors can access van status through vendor app
    test('Test 1 (vendor can set van status)', async () => agent
        
        // send request to access vendor page
        .post('/vendor/outStandingOrders/Chow Chariot')
        
        // set cookie
        .set('Cookie', cookie)

        .then((response) => {
            // van page should load
            expect(response.statusCode).toBe(200);
        })
    );

});   
