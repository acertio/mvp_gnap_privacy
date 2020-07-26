## Running

Implementation in NodeJs.

*This implementation has the client, AS portions and Interact_Server. It's written in NodeJs with a React front end. The **server** is an Express app with MongoDB Atlas, the **client** frontend is a React app, and the **Interact_Server** is a login and registration app with Express, Passport, Mongoose and EJS.*

To run, start with the client:

`npm install`

`npm start`

Then start with the AS:

`npm install`

`npm start`

Then start with the Interact_Server:

`npm install`

`npm start`

The client is accessible at <http://localhost:3000>

The AS is accessible at : <http://localhost:8080/as>

Acces Token allows you to get protected data. Use GET request with Authorization to see it. Or, 

`curl -H "Authorization: Bearer <token to copy>" http://localhost:8080/as/data`

