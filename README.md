# mvp_gnap_privacy
Test of new features for [GNAP](https://datatracker.ietf.org/wg/gnap/about/).

## Change log (in this version)

* basic support for DID 
* support for automated authorization policies
* support of RS hiding, see [privacy](https://github.com/acertio/mvp_gnap_privacy/blob/master/privacy.md)
* the IS can be chosen by the Client
* IS improvement: the consent result is sent to the AS (instead of harcoded in previous MVP)
* use case: we implemented a basic building management use case (room1, room2) with a resource owner (manager) and a user (employee). 

## Detailed flow

See details in [redirect.md](https://github.com/acertio/mvp_gnap_privacy/blob/master/redirect.md)

## Status

This is a quick proof of concept, do not use in production. 
We did not secure anything (not the goal of this project) and do not intend to provide support for this project. 

## Previous work

This MVP builds on previous work, also available on our github.

[Interact Server - IS](https://github.com/acertio/mvp_gnap_interact) which implements the architecture we described on the [GNAP wiki](https://github.com/ietf-wg-gnap/general/wiki/Modular-Interaction-Server)

[Protocol implementation](https://github.com/acertio/mvp_xyz) - "Redirect with Callback" flow

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


Then use `curl -H "Authorization: Bearer <token to copy>" "target_identifier_random_number: <value to copy>" http://localhost:8080/as/room1`
and you'll get access to a JSON message {"message":"This is room 1"}. 

Then use `curl -H "Authorization: Bearer <token to copy>" "target_identifier_random_number: <value to copy>" http://localhost:8080/as/room2`
and you'll get access to a JSON message {"message":"This is room 2"}. 
