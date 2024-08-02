let express = require('express');
let path = require('path');
let fs = require('fs');
let MongoClient = require('mongodb').MongoClient;
let bodyParser = require('body-parser');
let app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get('/profile-picture', function (req, res) {
  try {
    let img = fs.readFileSync(path.join(__dirname, "images/profile-1.jpg"));
    res.writeHead(200, { 'Content-Type': 'image/jpg' });
    res.end(img, 'binary');
  } catch (err) {
    res.status(404).send('Image not found');
  }
});

// Use environment variables for configuration
let mongoUrlLocal = process.env.MONGO_URL_LOCAL || "mongodb://admin:password@localhost:27017";
let mongoUrlDocker = process.env.MONGO_URL_DOCKER || "mongodb://admin:password@mongodb";
let mongoClientOptions = { useNewUrlParser: true, useUnifiedTopology: true };
let databaseName = process.env.DATABASE_NAME || "user-account";

app.post('/update-profile', function (req, res) {
  let userObj = req.body;

  MongoClient.connect(mongoUrlLocal, mongoClientOptions, function (err, client) {
    if (err) {
      console.error("Database connection failed:", err);
      return res.status(500).send("Database connection failed");
    }

    let db = client.db(databaseName);
    userObj['userid'] = 1;

    let myquery = { userid: 1 };
    let newvalues = { $set: userObj };

    db.collection("users").updateOne(myquery, newvalues, { upsert: true }, function (err, result) {
      client.close();
      if (err) {
        console.error("Failed to update profile:", err);
        return res.status(500).send("Failed to update profile");
      }
      res.send(userObj);
    });
  });
});

app.get('/get-profile', function (req, res) {
  MongoClient.connect(mongoUrlLocal, mongoClientOptions, function (err, client) {
    if (err) {
      console.error("Database connection failed:", err);
      return res.status(500).send("Database connection failed");
    }

    let db = client.db(databaseName);

    let myquery = { userid: 1 };

    db.collection("users").findOne(myquery, function (err, result) {
      client.close();
      if (err) {
        console.error("Failed to retrieve profile:", err);
        return res.status(500).send("Failed to retrieve profile");
      }
      res.send(result || {});
    });
  });
});

app.listen(3000, function () {
  console.log("app listening on port 3000!");
});
