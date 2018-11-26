# Assignment 6

Everything is contained in the repository: 
```
git@github.com:D-Workz/advancedImageManipulator.git
```
### Description

This solution is provided by: 
Dennis Sommer and 
Phillip Häusle 

The solution is implemented with:
 * A node server: Implementing the start of the image manipulation process and starting the timer. This is done on the client side, on server side the openWhisk action is invoked, which starts the image manipulation.
 * OpenWhisk actions in IBM-bluemix: The action implemented is the watermark image. It gets invoked by an image name, looks inside the IBM-Cloudant CouchDB for the data files, then adds the watermark on the image, saves it back in the DB and writes the imageName to IBM event-stream topic_1.
 * CouchDB in IBM Cloudant: Saving the images.
 * Kafka in IBM Event-Stream/MessageHub: Uses two topics for imageManipulation. The first topic is used after the image is watermarked, the second is used after the image is either greyscaled or enhanced.

Triggers are used inside openwhisk, to invoke the corresponding action. 
* If the trigger of topic_1 is called the action for enhance and greyscale are invoked. 
* Both actions are writing the filename into topic_2, both times the zip action is called, which checks if all images are in the DB if so it zips these and saves it back the DB. 


### Repository setup
* The docker folder contains all node files
* The openwhisk folder contains the files to create openWhisk actions

#### /docker/api

```
/public
```

Contains the client side of the process. After the server is started navigate to: localhost:3001
Here you can start the process and timer.
```
/routes/utils.js
```
Helper functions, accessing DB and writing with the help of producers to kafka.

```
/routes/images.js
   function invokeImageManipulationOnOpenwhisk ()
```
The main route file, receives the start from the client. 
Inside the function choose between NODE and OPENWHISK execution.
Contains a loop over 10 items (hardcoded) for every imageName the watermark.watermarkImage is called
```
/routes/watermark.js
    watermark.watermarkImage = function (imageName){
```
Processes images received by imageName, looks inside the cloudant for the image and watermarks it. Afterwards saves it again in DB and writes name into Kafka.
Use function to enable Saving image to DB and writing name to kafka (Line comments)
The node version works
1. getting the image and watermark from cloudant
2. manipulating it (watermark)
3. saving the result back in coudant 
4. writing the saved image name into event-stream topic_1 

(/config/default.json for details)
```
/config/default.json
```
All config to connect to services and topicName

#### openwhisk/server/actions

##### watermark action 
This action is in openwhisk called watermark

###### what is deployed:
all dependencies are inside to /watermark folder. 
* package.json (containing all lib dependencies)
* /config (contains configuration)
* /node-modules all dependencies for libs
* utils.js (utility functions used by most actions) 
* watermark.js (code for the action)

The code of the action is slightly refactored from the /docker/api/routes/watermark.js version, to suit the needs of OpenWhisk. 

folder is zipped and uploaded to ibm-bluemix:
then u need to execute this command (I put this into my bash file): 
```
alias ibmConnect='ibmcloud login -a api.eu-de.bluemix.net && ibmcloud target -r eu-gb -o "dennis.sommer.86@gmail.com" -s "dev"'
```
Then you can create an action like:
```
ibmcloud fn action <update/create> watermark watermark.zip --kind nodejs:default --web true
```
choose either update/create action name and zip file. 

Then action can be invoked in ibm or via action url (see endpoints in ibm actions)


#### What can be done

Unfortunately the current version cant be executed in Openwhisk, since it runs out of memory. Due to debugging this is because the dependencies of the rdkafka npm module are to big. The files are 80 MB zipped 34 MB, everytime I upload the zip with all dependencies inside the node_modules I receive out of memory. This happens even when I dont call the kafka components (inside util.js). 

If you change the current code in /routes/images, to execute the node version, you can see that the action, should work. The routes/watermark.js has an option, to switch if you want to save the watermarked imgs in DB or if you just want to push the image name into kafka, all this is done in the utils.js

#### Work on:

##### General 
* Think of memory proplem, 
* How to stop the timer after everything is done? 

### Feedback

Another assignment, which was about configuring different services, waiting for feedback, a lot of hours spent in try and error, task description change in the middle of the assignment, feedback came two days before submission of tasks to use other programming language or unknown limitations of services, which made it then impossible to restructure everything in the time given. 

Every week I tried another way of running the necessary services, for this week it was running services with IBM, which took a chunk of hours to configure and run. Had to use new libaries again, in the end it didnt work again, even after all these hours spent. 


 
