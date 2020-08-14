 ### RS Hiding 

The aim of such implementation is to be able to separate the RS and the AS. The AS no longer needs to see the content of the protected resources. 

 #### Step 1 : Client/AS

The client needs to calculate a concealed_target_identifier which is a hash of two values that we need to concatenate to each other in this order using a single newline character as a separator between the fields :

 1. target_identifier_random_number 
 2. resourcesLocation

The value of the concealed_target_identifier should be included in the request and sent to the AS.

 #### Step 2 : AS

The value of the concealed_target_identifier sent by the client will be included in the payload of the access token generated to get the protected resources. In our demo we use a jwt token signed by a private key. 

 #### Step 3 : Client/RS 

The client needs to present the target_identifier_random_number to the RS alongside the access token as a separate http header to get the protected resources.

 #### Step 4 : RS/Client 

 The RS needs to calculate the concealed_target_identifier using the target_identifier_random_number sent in the http header and the url of the protected resources and compare its value with the one included in the token, if they match the user can get access to the resources.  