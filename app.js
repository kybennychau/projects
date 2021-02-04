
const mongoose = require('mongoose');
const express = require("express");
const bodyParser = require("body-parser");
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set("useFindAndModify", false);
mongoose.connect("mongodb+srv://admin-benny:test123@cluster0.6i5ka.mongodb.net/todolistDB",
  {useNewUrlParser: true, useUnifiedTopology: true}
);

const itemsSchema = new mongoose.Schema({
  name: String
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Create a new Todo Item by typing at the New Item"
});

const item2 = new Item({
  name: "Click on the checkbox to delete"
});

const defaultItems = [item1, item2];

// After receiving a GET request, the system will find the db 
// of collection Item with the list name and then render the 
// list.ejs site.
app.get("/", function(req, res) {
  Item.find({}, function(err, items) {
    res.render("list", {listTitle: "Today", newListItems: items});
    });
});

// Add custom page to the list and create a new list. Or if the route exists,
// redirect to that route using the list name
app.get("/:categoryName", function(req, res){
  const categoryName = _.capitalize(req.params.categoryName);
  List.findOne({name: categoryName}, function(err, foundList) {
    if(!err) {
      if (!foundList) {
        const list = new List({
          name: categoryName,
          items: defaultItems
        });
        list.save(); // Create new list
        res.redirect("/" + categoryName); // Redirect back to the created list.
      } else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items}); // Show existing list
      }
    }
  });
});

// functionality of the add button. It adds new item to the "Today" list, or add
// into the custom route list, then redirect to the root route or the custom
// list route.
app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

// delete function by using the checkbox.
app.post("/delete", function(req,res) {
  const id = req.body.checkbox
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(id, function(err) {
      if (!err) {
        console.log("Successfully removed item: " + id);
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName},
        {$pull: {items: {_id: id}}},
        function(err, foundList) {
          if(!err) {
            res.redirect("/" + listName);
          }
      });
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});
