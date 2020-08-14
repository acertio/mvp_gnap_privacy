 #### XYZ/GNAP

 ### Process

```
   +--------+                                  +-------+                                        +---------------------------------+
   | Client |                                  |  AS   |                                        |      Interact_Server            |
   |        |--(1)--- txRequest -------------->|       |                                        |                                 |
   |        |                                  |       |--(2)---- InteractRequest-------------->|                                 |
   |        |                                  |       |                                        |                                 | 
   |        |                                  |       |<------- InteractResponse----------(3)--|                                 |   
   |        |<---- txResponse ---(4)-----------|       |                                        |                                 | 
   |        |                                  |       |                                        |                                 |
   |        |                                  |       |           +------+                     |                                 |
   |        |                                  |       |           | User |                     |                                 |           
   |        |--(5)--- interaction_url ---------| - - - |---------->|      |                     |  +-------+          +---------+ |
   |        |                                  |       |           |      |<-(6) http redirect--|->| Login |          | Consent | |
   |        |                                  |       |           |      |                     |  |       |<- AuthN->|         | |
   |        |	                               |       |<---(7)----| - - -|- ConsentRequest-----|--| - - - |----------|         | |
   |        |                                  |       |           |      |                     |  |       |          |         | |
   |        |                                  |       |----(8)----| - - -|- ConsentResponse----|--| - - - |--------->|         | |
   |        |                                  |       |           |      |                     |  |       |          |         | |
   |        |<- redirect to Client CallBack (9)| - - - |-----------|      |                     |  +-------+          +---------+ |
   |        |                                  |       |           |      |                     |                                 |
   |        |--(10)--- txContinuation -------->|       |           +------+                     |                                 |
   |        |                                  |       |                                        |                                 |
   |        |<--------- Token ------------(11)-|       |                                        |                                 |
   |        |                                  |       |                                        |                                 |
   +--------+                                  +-------+                                        +---------------------------------+
```

#### Step 1 : [Transaction Request](https://oauth.xyz/transactionrequest/)
The client begins the transaction by creating a transaction Request ***(1)***. It sends an http POST request to the transaction endpoint of the Authorization Server. The request is a JSON document that contains several parts :
```
display: {
   name:  "XYZ Redirect Client",
   uri:  ""
},
interact: {
   redirect:  true,
   callback: {
      uri:  "http://localhost:3000/Callback",
      nonce:  "APoVqjMtZWIPQj2fSCjw"
   },
   interact_server: "http://localhost:5000/"
},
ressources: {
   token1 : [
      {
         action : ["open", "check_availability"],
         concealed_target_identifier : "EE9LTYdqwPBkFiZamGg5D7XEcqwPye5XoP-fvQbwjswGDqCy9DqOKu5dNFWtFG5izFYsbiipmkmRnKRNhPpk-g",
      }
   ],
   token2 : [
      {
         action : ["open", "check_availability"],
         concealed_target_identifier : "fGeB4gUs1n2Ybm-WguxU0EIZTaz0uQaOdFg7JDubglybaWdL1dUBfUqBQjY700URorLBhtlR9g7D5b0OJVI--w",
      }
   ],
},
claimsRequest: {
   subject:  "02F861EA250FE40BB393AAF978C6E2A4",
   email:  "user@example.com"
},
user: {
   handle:  "",
   assertion:  ""
},
keys: {
   proof :  "OAUTHPOP",
   jwk : {
      keys: {
         kty:"RSA",
         e:"AQAB",
         kid:"xyz-client",
         alg:"RS256",
         n:"zwCT_3bx-glbbHrheYpYpRWiY9I-nEaMRpZnRrIjCs6b_emyTkBkDDEjSysi38OC73hj1-WgxcPdKNGZyIoH3QZen1MKyyhQpLJG1-oLNLqm7pXXtdYzSdC9O3-oiyy8ykO4YUyNZrRRfPcihdQCbO_OC8Qugmg9rgNDOSqppdaNeas1ov9PxYvxqrz1-8Ha7gkD00YECXHaB05uMaUadHq-O_WIvYXicg6I5j6S44VNU65VBwu-AlynTxQdMAWP3bYxVVy6p3-7eTJokvjYTFqgDVDZ8lUXbr5yCTnRhnhJgvf3VjD_malNe8-tOqK5OSDlHTy6gD9NqdGCm-Pm3Q"
      }
   }
}
```
The client needs to remember its own state, for this reason, we have chosen to use the localStorage property, so that the stored data is saved across browser sessions. Indeed, we have chosen to save :

 - Transaction Request
 - Transaction Response 
 - target_identifier_random_number

You can see that in the **postTransaction** function in the Client side: 

> src/pages/Transaction/Transaction.js  
 
The value of concealed_target_identifier is a hash of two values that we need to concatenate to each other in this order using a single newline character as a separator between the fields :

 1. target_identifier_random_number : random value only known by the Client.
 2. resourcesLocation : url of the protected resources that we want access to.

In our implementation, the client has the possibility to request one/two tokens. 

#### Step 2 : [Transaction Response](https://oauth.xyz/transactionresponse/)
Before the AS creates a unique interaction URL and returns it to the client ***(5)***. Note that the AS sends an http POST request to the Interact_Server ***(2)***:
```
uri: "http://localhost:3000/Callback",
client_nonce: "APoVqjMtZWIPQj2fSCjw",
server_nonce: "Ts05d5zdRzBtTgyb1kzX",
ressources: {
   token1 : [
      {
         action : ["open", "check_availability"],
         concealed_target_identifier : "EE9LTYdqwPBkFiZamGg5D7XEcqwPye5XoP-fvQbwjswGDqCy9DqOKu5dNFWtFG5izFYsbiipmkmRnKRNhPpk-g",
      }
   ],
   token2 : [
      {
         action : ["open", "check_availability"],
         concealed_target_identifier : "fGeB4gUs1n2Ybm-WguxU0EIZTaz0uQaOdFg7JDubglybaWdL1dUBfUqBQjY700URorLBhtlR9g7D5b0OJVI--w",
      }
   ],
}
```
And gets a response directly ***(3)*** : 
```
consent_nonce: "Lu35BvdX5k12v0PGT1HD"
```
When this operation is finished, the AS sends a response to the client that includes ***(4)***: 
```
handle:  { 
   type: "bearer",
   value: "4eZBXujpNashbuTq7FDHYP3cKYDKOS7ikTBNoDFsn8GiCySExr0ueF29VB7AeQ2g"
},
interaction_url: "http://localhost:5000/GXqG4uen3cLdiOcAtPgh",
interact_nonce: "AqOPZ1d2Ii73_qYiKy7xRy619rJM780r3pJ7Qp2PULoYPY5NX7uYOFVo-gUUDE_LDmWNr-bmQQgZSRG83yrV3Q"
```
The value of interact_nonce is a hash of two values that we need to concatenate to each other in this order using a single newline character as a separator between the fields :

 1. server_nonce
 2. consent_nonce

The value of interaction_url is a unique interaction url created by the AS. However, if the client indicates an interact_server's url, the latter is returned in lieu of interaction_url.

You can verify that in the **postTransaction** function in the Client side, by adding od deleting the value of interact_server: 

> src/pages/Transaction/Transaction.js  

#### Step 3 : [Transaction Interaction](https://oauth.xyz/interaction/) 
The client sends the user to an interactive page at the Interact_Server ***(6)***. 
```
http://localhost:5000/GXqG4uen3cLdiOcAtPgh
```
Once at the Interact_Server page, the user needs to login in if he already has an account otherwise he can register. For that he needs to specify a DID key that represents his unique identifier and can be used to retrieve his DID document. 

In our use case, we want to attribute for every person some specifics rights based on their identity. So, we used [Casbin](https://casbin.org) to manage policies as you can see it in the file **policy.csv** in the interact server side. 

We map every DID Key to a specific role and every role to some specific rights. For our example, we defined two different DID keys : 

```
did:key:z6Mkih6BdXRFioj1WcbpxXWuP1CfTMopSnfjhh38Bs8A9Lgd
did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH
```
That respectively have the following roles : 

 1. Manager
 2. Employee

In order to create your own did key you can use this code : 

```
const {Ed25519KeyPair} = require('crypto-ld');
const {keyToDidDoc} = require('did-method-key').driver();
const edKey = await Ed25519KeyPair.generate();
keyToDidDoc(edKey);
````

If a user indicates the first DID key while he registers, he would be considered as a manager and will have the rights to **Open** and **Check availability** for both: 

 - Room 1
 - Room 2

else, if a user designates the second one, he would be considered as an employee and will have the rights to **Open** and **Check availability** for just : 

 - Room 1

When we know who the user is, the latter is redirected to the consent page where he can accept or deny to get one or two access tokens depending on how many tokens requested by the client. Note if a client requested two tokens and the user presented a DID key that is for an employee, the AS will only generated one token, the same thing if the client requested one token and the user uses a DID key for a manager, even if he has the right to **Open** and **Check availability** for both rooms, the AS will generated one token because it is what requested by the client. 

Once there the Interact_Server sends an http POST request to the AS ***(7)*** :

```
consent_handler: "8F3If9O8sp1WieDBSMeN"
id: "did:key:z6Mkih6BdXRFioj1WcbpxXWuP1CfTMopSnfjhh38Bs8A9Lgd"
name: "Manager"
email: "manager@gmail.com"
resources: {
   action: [
      room1_open_check: true
      room2_open_check: true 
      room1_checkAvailabilty: true
      room2_checkAvailabilty: true
   ]
}
```
and gets a response that looks like ***(8)*** :

```
interact_handle: "sgxDE79QwFgoCP5UcLheC57NFOoTI2eBy32KFuqiRwU1EuvOueZqDvTQo-eyz4-KvuzCR7RI6-4DQGPY99OaTg"
```
The value of interact_handle is a hash of two values that we need to concatenate to each other in this order using a single newline character as a separator between the fields :

 1. consent_handler
 2. AS secret 
 
The value of AS secret is unique, random, and only known by the AS.

The Consent Server returns the user to the Client by redirecting the RO's browser to the Client's callback URL presented at the start of the transaction ***(9)***, with the addition of two query parameters :
 1. **hash**
 2. **interact_ref**

```
http://localhost:3000/Callback?hash=arf9mm3pnOBYLfM2CA39edFRWxRQtyVoNRqEDm_ahFRzIEUAayUj3j5S3WBVCWvcOdPWKoWYj-9v_IelYYaFCg&interact=sgxDE79QwFgoCP5UcLheC57NFOoTI2eBy32KFuqiRwU1EuvOueZqDvTQo-eyz4-KvuzCR7RI6-4DQGPY99OaTg
```
To calculate the “**hash**” value for the interaction response, we need to concatenate these three values to each other in this order using a single newline character as a separator between the fields : 

 1. "***client_nonce***" value sent by the AS in the Consent Request
```
APoVqjMtZWIPQj2fSCjw
```
 2. "***interact_nonce***" value sent by the AS in the Consent Request
```
AqOPZ1d2Ii73_qYiKy7xRy619rJM780r3pJ7Qp2PULoYPY5NX7uYOFVo-gUUDE_LDmWNr-bmQQgZSRG83yrV3Q 
```
 3. "***interact_handle***" unguessable interaction handle, value returned in the interact Handler. 
```
sgxDE79QwFgoCP5UcLheC57NFOoTI2eBy32KFuqiRwU1EuvOueZqDvTQo-eyz4-KvuzCR7RI6-4DQGPY99OaTg
```
The client needs to parse the `hash` parameter and compare its value to a hash calculated by its originally chosen `nonce` value, the server's returned `interact_nonce` value from the original transaction request, and the value of the `interact_handle`reference parameter from the callback request. To get the first two values, we use the  localStorage property, and for the last one, we opted to use the queryString module. 

If these hash values don't match the client returns an error to the user and stops the transaction. 

You can verify that by :

- Changing the excepted value of the hash in the client side, after the **componentDidMount** method 
   > src/pages/Callback/Callback.js  

The Client then sends an http POST request to the AS ***(10)***, that includes :
-   ***handle***
-   ***interact_ref***
```
handle: "4eZBXujpNashbuTq7FDHYP3cKYDKOS7ikTBNoDFsn8GiCySExr0ueF29VB7AeQ2g",
interact_ref: "sgxDE79QwFgoCP5UcLheC57NFOoTI2eBy32KFuqiRwU1EuvOueZqDvTQo-eyz4-KvuzCR7RI6-4DQGPY99OaTg"
```
You can see that in the **txContinuehandler** function in the Client side: 

> src/pages/Callback/Callback.js  
 
The AS looks up the transaction from the transaction handle and fetches the interaction reference associated with that transaction. The AS compares the presented reference to the stored interaction reference it appended to the client's callback with `interact_handle`. Also, the AS needs to compare the handle value given in the transaction Response and the value sent by the client during the transaction continue request. If they match, the AS continues processing as normal, likely issuing a token ***(11)***. 

You can verify that by :

- Changing the value of **interact_ref** or the **handle** in the server side after the **transactionContinue** function 
   > controllers/authserver.js


#### Improvements 

One of the major improvments to our work is fiding a solution to verify the did keys provided in the register page. 
We can't let someone use someone else did key.
The most basic solution is the creation of a database mapping every employee with his did key and use it to verify if the did key provided match with the name and the rest of the provided informations.