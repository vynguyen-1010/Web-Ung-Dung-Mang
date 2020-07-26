var express = require("express");
var router = express.Router();
const Products = require("../models/product");
const Categories = require("../models/productCategory");
const Cart = require("../models/cart");
var Users = require("../models/user");
const Order = require("../models/order");

//var productRouter = require('./routes/product');
//var shopRouter = require('./routes/shop');

const productController = require("../controllers/product");
var images = [];

var ITEM_PER_PAGE = 12;
var SORT_ITEM;
var sort_value = "Giá thấp tới cao";
var ptype;
var ptypesub;
var pprice = 999999;
var psize;
var plabel;
var plowerprice;
var price;
var searchText;





router.get("/:productId", function (req, res, next) {
    var cartProduct;
    if (!req.session.cart) {
      cartProduct = null;
    } else {
      var cart = new Cart(req.session.cart);
      cartProduct = cart.generateArray();
    }
    const prodId = req.params.productId;
    Products.findOne({ _id: `${prodId}` }).then(product => {
      Products.find({ "productType.main": product.productType.main }).then(
        relatedProducts => {
          res.render("product", {
            "title": `${product.name}`,
            "user": req.user,
            "prod": product,
            "comments": product.comment.items,
            "allComment": product.comment.total,
            "cartProduct": cartProduct,
            "relatedProducts": relatedProducts
          });
          product.save();
        }
      );
    });
    });

    router.post("/:productId", function (req, res, next) {
        const prodId = req.params.productId;
        var tname;
        if (typeof req.user === "undefined") {
          tname = req.body.inputName;
        } else {
          tname = req.user.username;
        }
        Products.findOne({
          _id: prodId
        }).then(product => {
          var today = new Date();
          product.comment.items.push({
            title: req.body.inputTitle,
            content: req.body.inputContent,
            name: tname,
            date: today,
            star: req.body.rating
          });
          product.comment.total++;
          product.save();
        });
        res.redirect("back")
        });

        module.exports = router;
