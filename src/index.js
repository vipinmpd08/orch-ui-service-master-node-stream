const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { promisify } = require('util');
const { Readable } = require('stream');
const { createReadStream } = require('fs');
const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Data
var userDetails = [
    {
        "name": "runInterval",
        "value": "15",
        "paramDesc": "Run Interval",
        "inputType": "dropdown",
        "possibleValues": [15, 20, 25, 30],
    },
    {
        "name": "runInterval",
        "value": "15",
        "paramDesc": "Run Interval",
        "inputType": "textBox",
        "possibleValues": "",
    },
];

//Getting the data through a callback
var getMasterDataJSON = (str, masterDataCallbackResult) => {
    masterDataCallbackResult(userDetails);
}

//Getting the data through a callback - Promisify
var getMasterDataJSONPromisify = (str, masterDataCallbackResult) => {
    masterDataCallbackResult(null, userDetails);
}

//Returns new Promise of Master Data
getMasterData = () => {
    return new Promise((resolve, reject) => {
        resolve(userDetails);
    });
}

//new Promise for chaining
var masterDataPromise = () => new Promise((resolve, reject) => {
    if (userDetails) {
        resolve(userDetails);
    } else {
        reject(new Error("No master data found"));
    }
});


//Streaming using redable
class StreamFromJSON extends Readable {

    constructor(jsonData) {
        super({ objectMode: true })
        this.jsonData = jsonData;
        this.index = 0;
    }

    _read() {
        if (this.index <= this.jsonData.length) {
            const eachChunk = this.jsonData[this.index];
            if (eachChunk) {
                this.push(eachChunk);
                this.index++;
            }
        } else {
            this.push(null)
        }
    }
}

//Async/Await model
app.get('/orchestrator/api/master-data', async (req, res) => {
    console.log("Request for master data")


    //Callback
    await getMasterDataJSON("", masterDataCallbackResult = (result) => {
        console.log("This is the data through callback " + JSON.stringify(result));
    });

    //Promisify
    var promiseMasterDataPromisify = promisify(getMasterDataJSONPromisify);
    promiseMasterDataPromisify("")
        .then((result) => console.log(`This is through promisify ` + JSON.stringify(result)))
        .catch(console.log);


    //Promise
    await getMasterData()
        .then((data) => console.log)
        .then(() => console.log("Got Master Data response"))
        .catch((e) => console.error(e));

    //Promise chaining sequential
    await Promise.resolve()
        .then(() => console.log("chaining starts"))
        .then(masterDataPromise().then(console.log))
        .then(() => console.log("chaining ends"))

    //Streaming Chunk using Readable
    const dataStream = await new StreamFromJSON(userDetails);
    dataStream.on('data', (chunk) => console.log("Chunk " + JSON.stringify(chunk)))
    dataStream.on('end', () => console.log(`End`))

    await createReadStream('src/masterdata.json').pipe(res);

    //Will wait for first operation to close
    console.log("Completed master data request")
});

app.listen(port, () => console.log(`Mock server listening on port ${port}`));
