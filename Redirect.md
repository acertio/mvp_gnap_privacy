 #### XYZ/GNAP

 ### Process

```
   +--------+                                  +-------+                                        +---------------------------------+
   | Client |                                  |  AS   |                                        |      Interact_Server            |
   |        |--(1)--- txRequest -------------->|       |                                        |                                 |
   |        |                                  |       |--(2)---- ConsentRequest--------------->|                                 |
   |        |                                  |       |                                        |                                 | 
   |        |                                  |       |<------- ConsentResponse-----------(3)--|                                 |   
   |        |<---- txResponse ---(4)-----------|       |                                        |                                 | 
   |        |                                  |       |                                        |                                 |
   |        |                                  |       |           +------+                     |                                 |
   |        |                                  |       |           | User |                     |                                 |           
   |        |--(5)--- interaction_url ---------| - - - |---------->|      |                     |  +-------+          +---------+ |
   |        |                                  |       |           |      |<-(6) http redirect--|->| Login |          | Consent | |
   |        |                                  |       |           |      |                     |  |       |<- AuthN->|         | |
   |        |	                                |       |<---(7)----| - - -|- ConsentHandler-----|--| - - - |--------->|         | |
   |        |                                  |       |           |      |                     |  |       |          |         | |
   |        |                                  |       |----(8)----| - - -|- InteractHandler----|--| - - - |--------->|         | |
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
      nonce:  "hFKNsKS5fpR8vMZ8ML3d"
   }
},
resourceRequest: {
   ressources : [
      {
         action : [],
         locations : [],
         data : []
      }
   ]
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

You can see that in the **postTransaction** function in the Client side: 

> src/pages/Transaction/Transaction.js  
 
#### Step 2 : [Transaction Response](https://oauth.xyz/transactionresponse/)
Before the AS creates a unique interaction URL and returns it to the client ***(5)***. Note that the AS sends an http POST request to the Interact_Server ***(2)***:
```
uri: "http://localhost:3000/Callback",
client_nonce: "hFKNsKS5fpR8vMZ8ML3d",
server_nonce: "SRo2CpNXqaj5hQFMscX5"
```
And gets a response directly ***(3)*** : 
```
consent_nonce: "sEYVj53DyTBCHlre32dN"
```
When this operation is finished, the AS sends a response to the client that includes ***(4)***: 
```
handle:  { 
   type: "bearer",
   value: "vVReak9WP1JA9ELHpGjcJtTuIwxfJHqINZ0XhPS1flLfBqPj9U8ZnjG18EtKT1CY"
},
interaction_url: "http://localhost:8000/rwZb9Fu7ja4vbUdIBWoM",
interact_nonce: "b9KviKcQ428V45EFj4PzItVE4VS_LKb5yLBfpyucN20owHTY3xvl1Uqz8yz8U-XdBbYeNT4tAcgeoeVcPWEnYg"
```
The value of interact_nonce is a hash of two values that we need to concatenate to each other in this order using a single newline character as a separator between the fields :

 1. server_nonce
 2. consent_nonce

#### Step 3 : [Transaction Interaction](https://oauth.xyz/interaction/) 
The client sends the user to an interactive page at the Interact_Server ***(6)***. 
```
http://localhost:8000/rwZb9Fu7ja4vbUdIBWoM
```
Once at the Interact_Server page, the user needs login in if he already has an account otherwise he can register. When we know who the user is, the latter is redirected to the consent page where he can accept or deny to get the access token. Once there the Interact_Server sends an http POST request to the AS ***(7)*** :
```
consent_handler: "eHPkq7ZtfQrMUCc39YAa"
```
and gets a response that looks like ***(8)*** :
```
interact_handle: "IQyDT5HcaOHNKRJbM2pGtY7pqsklD_1psjeDhxAEcIPwiGLoqfdpdETgwpBe8t8YePkh47eQAYDpRBLBJNdppg"
```
The value of interact_handle is a hash of two values that we need to concatenate to each other in this order using a single newline character as a separator between the fields :

 1. consent_handler
 2. AS secret 
 
The value of AS secret is unique, random, and only known by the AS.

The Consent Server returns the user to the Client by redirecting the RO's browser to the Client's callback URL presented at the start of the transaction ***(9)***, with the addition of two query parameters :
 1. **hash**
 2. **interact_ref**

```
http://localhost:3000/Callback?hash=arf9mm3pnOBYLfM2CA39edFRWxRQtyVoNRqEDm_ahFRzIEUAayUj3j5S3WBVCWvcOdPWKoWYj-9v_IelYYaFCg&interact=IQyDT5HcaOHNKRJbM2pGtY7pqsklD_1psjeDhxAEcIPwiGLoqfdpdETgwpBe8t8YePkh47eQAYDpRBLBJNdppg
```
To calculate the “**hash**” value for the interaction response, we need to concatenate these three values to each other in this order using a single newline character as a separator between the fields : 

 1. "***client_nonce***" value sent by the AS in the Consent Request
```
hFKNsKS5fpR8vMZ8ML3d
```
 2. "***interact_nonce***" value sent by the AS in the Consent Request
```
b9KviKcQ428V45EFj4PzItVE4VS_LKb5yLBfpyucN20owHTY3xvl1Uqz8yz8U-XdBbYeNT4tAcgeoeVcPWEnYg
 ```
 3. "***interact_handle***" unguessable interaction handle, value returned in the interact Handler. 
```
BojUB3V0hBXzkDzvE_Wbnw4b0oC8Y99FI7uih7DFXdacFmrCSEeVb-_PpAj_eJjX5G3CUi6MLMxBce8NiT9E7Q
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
handle: "vVReak9WP1JA9ELHpGjcJtTuIwxfJHqINZ0XhPS1flLfBqPj9U8ZnjG18EtKT1CY",
interact_ref: "BojUB3V0hBXzkDzvE_Wbnw4b0oC8Y99FI7uih7DFXdacFmrCSEeVb-_PpAj_eJjX5G3CUi6MLMxBce8NiT9E7Q"
```
You can see that in the **txContinuehandler** function in the Client side: 

> src/pages/Callback/Callback.js  
 
The AS looks up the transaction from the transaction handle and fetches the interaction reference associated with that transaction. The AS compares the presented reference to the stored interaction reference it appended to the client's callback with `interact_handle`. Also, the AS needs to compare the handle value given in the transaction Response and the value sent by the client during the transaction continue request. If they match, the AS continues processing as normal, likely issuing a token ***(11)***. 

You can verify that by :

- Changing the value of **interact_ref** or the **handle** in the server side after the **transactionContinue** function 
   > controllers/authserver.js
