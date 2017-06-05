// Dependencies
var express = require("express");
var exphbs = require("express-handlebars");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var path = require("path");
var methodOverride = require('method-override')

// Requiring our Note and Article models
var Note = require("./models/note.js");
var Article = require("./models/article.js");
// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");
// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;
//Defning connection to work local or deployed
var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Use body parser with our app
app.use(bodyParser.urlencoded({
    extended: false
}));

// Make public a static dir
app.use(express.static(path.join(__dirname, '/public')));

// override with POST having ?_method=PUT
app.use(methodOverride('_method'))

//Setting handlebars as view engine
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

//Local Database configuration with mongoose
mongoose.connect("mongodb://localhost/articleDB");
//to deploy un-comment the below
//mongoose.connect("mongodb://heroku_htkv646v:8i7hgdnv85219v2d43reo1flbc@ds157571.mlab.com:57571/heroku_htkv646v")
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
    console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
    console.log("Mongoose connection successful.");
});


// Routes
// =========================================
//home page
app.get("/", function(req, res) {
    res.render('index');
});

// A GET request to scrape the comics website
app.get("/scrape", function(req, res) {
    // First, we grab the body of the html with request
    request("http://comicsalliance.com/", function(error, response, html) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(html);
        // Now, we grab every h2 within an article tag, and do the following:
        $('h2.title').each(function(i, element) {
            // Save an empty result object
            var result = {};
            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(this).children("a").attr("title")
            result.link = $(this).children("a").attr("href")
                // Using our Article model, create a new entry
                // This effectively passes the result object to the entry (and the title and link)
            var entry = new Article(result);

            // Now, save that entry to the db
            entry.save(function(err, doc) {
                // Log any errors
                if (err) {
                    console.log(err);
                }
                // Or log the doc
                else {
                    console.log(doc);
                }
            });

        });
    });
    // Bring you to the all articles list when it is done scrapign
    res.redirect("/articles");
});

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
  // Grab every doc in the Articles array
  Article.find({}, function(error, doc) {
      //Log any errors
      if (error) {
          console.log(error);
      }
      // if no errors render our page with the articles we scraped
      else {
          res.render('scrape', {
              allArticles: doc
          });
      }
  });
});

// Grab an article by it's ObjectId and load the notes
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter 
    //prepare a query that finds the matching one in our db...
  Article.findOne({ "_id": req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    // now, execute our query
    .exec(function(error, doc) {
        console.log(doc)
        // Log any errors
        if (error) {
          console.log(error);
        }
        //if no errors render the page
        else {
          res.render('comments', {
              articles: doc
          });
        }
    });
});


// Create a new note or replace an existing note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  var newNote = new Note(req.body);
  var currentArticleID = req.params.id;
  //And save the new note the db
  newNote.save(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's note
      Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
        // Execute the above query
        .exec(function(err, doc) {
          // Log any errors
          if (err) {
            console.log(err);
          } else {
            // Or send the document to the browser
            res.redirect("/articles/" + currentArticleID)
          }
      });
    }
  });
});

//saving an article
app.post("/save/:id", function(req, res) {
  Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": true })
    // Execute the above query
    .exec(function(err, doc) {
      // Log any errors
      if (err) {
          console.log(err);
      } else {
        // Or send the user back to the all articles page once it saved
        res.redirect("/saved");
      }
    });
})

//deleting the article form the saved list
app.put("/delete/:id", function(req, res) {
  Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": false })
    // Execute the above query
    .exec(function(err, doc) {
      // Log any errors
      if (err) {
          console.log(err);
      } else {
        //basically.. refresh the page
        res.redirect("/saved");
      }
    });
})

//showing the saved articles
app.get("/saved", function(req, res) {
  // Grab every saved doc in the Articles db
  Article.find({ 'saved': true }, function(error, doc) {
    //Log any errors
    if (error) {
        console.log(error);
    // If no errors render the page with the saved articles
    } else {
        res.render('savedArticles', {
            allArticles: doc
        });
      }
  });
});

// Listener
app.listen(PORT, function() {
    console.log("App running on port 3000!");
});
