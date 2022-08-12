//jshint esversion:6
//requiring express app and other modules
const express = require("express");
const bodyParser = require("body-parser");

//requiring the mongoose module
const mongoose = require("mongoose");

//requiring the lodash module for capitalizing and lowercasing the first letter of a string
const _ = require("lodash");

//my express app
const app = express();

// method for ejs for embedding in html
app.set("view engine", "ejs");

//method for body-parser for parsing the body of the request
app.use(bodyParser.urlencoded({ extended: true }));

//method for public folder for css and js files
app.use(express.static("public"));

//method for connecting to the mongoose database
mongoose.connect("mongodb+srv://atharva:Test123@atlascluster.209aqo6.mongodb.net/todolistDB", {
  useNewUrlParser: true,
});

//method for creating a schema for the todo list
const itemsSchema = {
  name: String,
};

//method for creating a model for the todo list
const Item = mongoose.model("Item", itemsSchema);

//method for creating a default item for the todo list
const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

// default array for the db
const defaultItems = [item1, item2, item3];

//creating new schema for the todo list
const listSchema = {
  name: String,
  items: [itemsSchema],
};

//creating a model for the todo list
const List = mongoose.model("List", listSchema);

//get method for the root route
app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    //find all the items in the db
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        //insert multimple items into the db
        if (err) {
          console.log(err); //error handling
        } else {
          console.log("Successfully savevd default items to DB.");
        }
      });
      //redirect to the root route
      res.redirect("/");
    } else {
      //render the index.ejs file
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

//get method for the custom list route
app.get("/:customListName", function (req, res) {
  //using lodash for capitalizing the first letter of the custom list name
  const customListName = _.capitalize(req.params.customListName);
  //find the list in the db
  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        //save the list to the db
        list.save();
        //redirect to the root route
        res.redirect("/" + customListName);
      } else {
        //Show an existing list
        //render the index.ejs file
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

//post method for the root route
app.post("/", function (req, res) {
  //get the name of the new item from the form
  const itemName = req.body.newItem;
  //get the listname from the form
  const listName = req.body.list;
  //create a new item
  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
      //saving the item into the list entered in the form
    });
  }
});

//post method for the custom list route to delete the entry
app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    //delete the item from the db
    //mongoose method
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    //mongoose method
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

//get to the about page just for casual purposes
app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port);

//listen to the port
app.listen(port, function () {
  console.log("Server started on port 3000");
});
//end of the app.js file
