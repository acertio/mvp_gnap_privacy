# mvp_gnap_interact
proof of concept for IETF mailing list

## Goal

This project aims to demonstrate the value of separating the authorization part and the interaction part. 
We took some inspiration from https://www.ory.sh/hydra/docs/implementing-consent with the goal of clearly separating the concerns. We adapted the flow to XYZ/GNAP (redirect with callback case) instead of OAuth2.

The benefits of this approach are: 
- on the interaction side, the focus on the UX for login (or similar) and consent. The client may even provide its own interaction server in the request, so that the AS never needs to know which information is requested (good for privacy). The interaction server would typically be focused on the frontend components that end-users would see. 
- on the authorization server side, we focus only on HTTP flows and cryptographic modules. Currently we do this in javascript but our aim is to support more secure and optimized implementations, without the need to also support frontend development. 

Interestingly, the core XYZ between the Client and the AS isn't modified. The request/response mecanism between them has not changed, so the actual implementation is transparent to the Client (except from the domain used).

Changes compared to the core XYZ proposal:
- the interact uri is now pointing to the interact server, instead of being part of the AS.
- the callback_server_nonce has become a hash of nonces from the AS and the interact (as we now have 2 servers). 

See more details in [redirect.md](https://github.com/acertio/mvp_gnap_interact/blob/master/Redirect.md#process)

## Status

This is a quick proof of concept, do not use in production. 
We did not secure anything (not the goal of this project) and do not intend to provide support for this project.

The protocol flow is based on XYZ, before the latest version was published by Justin a few days ago. Will update later on.

Note than we included a (very naive) login component to start working on identity claims (to start working on OIDC like authentication), but our main focus is authorization.

## Running

Implementation in NodeJs.

*This implementation has the client, AS portions and Interact_Server. It's written in NodeJs with a React front end. The **server** is an Express app with MongoDB Atlas, the **client** frontend is a React app, and the **Interact_Server** is a login and registration app with Express, Passport, Mongoose and EJS.*

To run, start with the AS:

`npm install`

`npm start`

Then start with the Interact_Server:

`npm install`

`npm start`

Then start with the Client:

`npm install`

`npm start`

The client is accessible at <http://localhost:3000> 

The AS is accessible at : <http://localhost:8080/as>


## Using

Click on "New Transaction" to start the authorization flow. 

The user either needs to register (we don't need a real email, put anything there) or may login if it already has an account.
Then the user gets prompted for consent.

After the consent has been given, an Access Token is generated (here a basic JWT).

By default, a request to a protected endpoint will display "unauthorized" in your browser. 

Please copy the value of the Access Token and the target_identifier_random_number on your local Storage to get access to the protected data (for demo purposes, we implemented a protected endpoint on the as). 


Then use `curl -H "Authorization: Bearer <token to copy>" "target_identifier_random_number: <value to copy>" http://localhost:8080/as/data`
and you'll get access to a JSON message {"message":"This is Protected Data"}. 


