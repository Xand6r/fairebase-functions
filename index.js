// import the reqiuired libraries
const functions = require('firebase-functions');
const express=require("express");
const cors= require("cors");
const admin = require("firebase-admin");
const uuidv5 = require("uuid/v5"); //uuid for generating random id's for clients

// initialize the database
admin.initializeApp();
const app = express()

// define the keys which we are  going to get from the API
const keys=['firstName','lastName','age','dateOfBirth','hobbies'];

// helper function to find if a group of keys is not present in an object
function notComplete(obj,keys){
    // go through each key, and confirm that they are present in the object
    for (key of keys){

        if(obj[key] === undefined ){
            // return the misssing key if one key is missing
            return key;
        }

    }
    // return false if all keys are present.
    return false;
}

// middlewares for the app
app.use(cors()); //use cors for resource sharing
app.use(express.urlencoded({extended:false})); //enable url-encoded types too
app.use(express.json()); //enable us recieve json types in the request's body

// create a post route for the function
app.post("/",(request,response)=>{
    // parse the stringifies body
    const content =JSON.parse(request.body);

    // confirm that all the arguments are present in the body of the request
    const missingKey = notComplete(content,keys);
    // if there is a missing value, respond with that value for clarity
    if(missingKey){
        return response.status(400).send(`You provided incomplete keyvalue pairs, make sure the key: ${missingKey} is present`);
    }

    // since all the values are present get them ad save them in the entry object
    const entry = {};
    for (key of keys){
        entry[key]=content[key];
    }
    // save this entry into the entries collection in the db
    return admin.database().ref("/users").push(entry)
    .then(()=>{
        // if it was sucesfull respond with that user
        return response.status(200).send(entry);
    })
    .catch(error=>{
        // if there was an error,respond with a server error code
        console.log(error);
        return response.status(500).send("Oh no ! Error:"+error);
    })

});

// an endpoint to get all the users present in the db
app.get("/",(request,response)=>{
    // get all the entries present in the db and return them
    return admin.database().ref("/users").on("value",snapshot=>{
        return response.status(200).send(snapshot.val());
    },error=>{
        console.log(error);
        return response.status(500).send("Oh no!  there was an error",error);
    })
});

// create a function which we can use to get users from the db or add users to the db
exports.addOrGetUser = functions.https.onRequest(app)



// add an evenlistener function to add an id to our user when they are created in the database
exports.addUserId = functions.database.ref('/users/{pushId}/')
    .onCreate((snapshot, context) => {
        // get the unique pushId of this object in the db
        const pushId = context.params.pushId ;
        // use this Id with the uuid library to generate a unique ID
        const uniqueId= uuidv5(pushId,uuidv5.URL);
        // update this user with his Id
      return snapshot.ref.child('User Id').set(uniqueId);
    });
