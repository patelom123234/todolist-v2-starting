//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://ompatel5044:1YQO7euHyKuvOxP7@cluster0.ampxsg8.mongodb.net/todolistDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemSchema = new mongoose.Schema({
  task: String
});

const listSchema = new mongoose.Schema({
  task: String,
  items: [itemSchema]
});

const Item = mongoose.model('Item', itemSchema);
const ListItem = mongoose.model("List", listSchema);

const defaultItems = [
  { task: 'this is defalt Items' },
  {task: 'you can add item by clicking plus button'}
];

async function checkAndInsertDefaultItems(task) {
  try {
    const existingList = await ListItem.findOne({ task: task });
    if (!existingList) {
      await ListItem.create({
        task: task,
        items: defaultItems
      });
      console.log(`Default data for '${task}' inserted successfully`);
    }
  } catch (err) {
    console.log('Error:', err);
  }
}

app.get("/", async function (req, res) {
  try {
    await checkAndInsertDefaultItems(""); // Insert default items for the root route

    const items = await Item.find();
    res.render("list", { listTitle: "Today", newListItems: items });
  } catch (err) {
    handleError(err, res);
  }
});


app.post("/", async function (req, res) {
  try {
    const newItem = new Item({ task: req.body.newItem });
    if (newItem.task !== "") {
      await newItem.save();
      console.log('New item added successfully');
    }
    res.redirect("/");
  } catch (err) {
    handleError(err, res);
  }
});

app.post("/delete", async function (req, res) {
  try {
    const idsToDelete = req.body.deleteitem;
    await Item.deleteMany({ _id: { $in: idsToDelete } });
    res.redirect("/");
  } catch (err) {
    handleError(err, res);
  }
});

app.get("/:route", async function (req, res) {
  try {
    const any = _.lowerCase(req.params.route);

    if (any === "today") {
      res.redirect("/");
      return;
    }

    await checkAndInsertDefaultItems(any);

    const list = await ListItem.findOne({ task: any });
    res.render("list", { listTitle: any, newListItems: list.items });
  } catch (err) {
    handleError(err, res);
  }
});

app.post("/:route/delete", async function (req, res) {
  try {
    const idsToDelete = req.body.deleteitem;
    await ListItem.findOneAndUpdate(
      { task: req.params.route },
      { $pull: { items: { _id: { $in: idsToDelete } } } }
    );
    res.redirect(`/${req.params.route}`);
  } catch (err) {
    handleError(err, res);
  }
});

app.post("/:route", async function (req, res) {
  try {
    const any = _.lowerCase(req.params.route);
    if (any === "today") {
      res.redirect("/");
      return;
    }

    const newItem = new ListItem({ task: req.body.newItem });

    const existingList = await ListItem.findOne({ task: any });
 
    if (existingList) {
      if (newItem.task !== "") {
        existingList.items.push(newItem);
      }
      await existingList.save();
    }

    res.redirect(`/${req.params.route}`);
  } catch (err) {
    handleError(err, res);
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});

function handleError(err, res) {
  console.log('Error:', err);
  res.status(500).send('Internal Server Error');
}
