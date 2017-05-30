
// Dependencies
var express = require("express");
// Initialize Express
var app = express();
// Set up a static folder (public) for our web app
app.use(express.static("public"));
// Use mongojs to hook the database to the db variable
var connect = require('./db').connect;
// Routes
// 1. At the root path, send a simple hello world message to the browser
app.get("/", function(req, res) {
  res.send("Hello world");
});
// 2. At the "/all" path, display every entry in the animals collection
app.get("/all", function(req, res) {
  connect().then(function (db) {
    // Query: In our database, go to the animals collection, then "find" everything
    // Log any errors if the server encounters one
    // Otherwise, send the result of this query to the browser
    return db.collection('animals')
      .find({})
      .toArray()
  }).then(function () {
    // send response json
  })
});
// 3. At the "/name" path, display every entry in the animals collection, sorted by name
app.get("/name", function(req, res) {
  // Query: In our database, go to the animals collection, then "find" everything,
  // but this time, sort it by name (1 means ascending order)
  // Log any errors if the server encounters one
  // Otherwise, send the result of this query to the browser
});
// 4. At the "/weight" path, display every entry in the animals collection, sorted by weight
app.get("/weight", function(req, res) {
  // Query: In our database, go to the animals collection, then "find" everything,
  // but this time, sort it by weight (-1 means descending order)
  // Log any errors if the server encounters one
  // Otherwise, send the result of this query to the browser
});
// Set the app to listen on port 3000
connect().then(function () {
  app.listen(3000, function() {
    console.log("App running on port 3000!");
  });
});