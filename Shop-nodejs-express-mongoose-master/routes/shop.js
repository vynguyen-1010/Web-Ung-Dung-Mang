var express = require("express");
var router = express.Router();
const Products = require("../models/product");
const Categories = require("../models/productCategory");
const Cart = require("../models/cart");
var Users = require("../models/user");
const Order = require("../models/order");
var productRouter = require('./routes/product');
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

// Get homepage và product page

router.get("/", function (req, res, next) { 
  var cartProduct;
  if (!req.session.cart) {
    cartProduct = null;
  } else {
    var cart = new Cart(req.session.cart);
    cartProduct = cart.generateArray();
  }

  Products.find()
    .limit(4)
    .then(products => {
      Products.find()
        .limit(4)
        .sort("buyCounts")
        .then(products2 => {
          res.render("index", {
            title: "Trang chủ",
            user: req.user,
            trendings: products,
            hots: products2,
            cartProduct: cartProduct
          });
        });
    })
    .catch(err => {
      console.log(err);
    });
 });



router.get("/products/:productType?/:productChild?", function (req, res, next) { 
  var cartProduct;
  if (!req.session.cart) {
    cartProduct = null;
  } else {
    var cart = new Cart(req.session.cart);
    cartProduct = cart.generateArray();
  }
  let productType = req.params.productType;
  let productChild = req.params.productChild;

  ptype = req.query.type !== undefined ? req.query.type : ptype;
  ptypesub = req.query.type !== undefined ? req.query.type : ptypesub;
  pprice = req.query.price !== undefined ? req.query.price : 999999;
  psize = req.query.size !== undefined ? req.query.size : psize;
  plabel = req.query.label !== undefined ? req.query.label : plabel;
  plowerprice = pprice !== 999999 ? pprice - 50 : 0;
  plowerprice = pprice == 1000000 ? 200 : plowerprice;
  SORT_ITEM = req.query.orderby;

  if (SORT_ITEM == -1) {
    sort_value = "Giá cao tới thấp";
    price = "-1";
  }
  if (SORT_ITEM == 1) {
    sort_value = "Giá thấp tới cao";
    price = "1";
  }

  if (Object.entries(req.query).length == 0) {
    ptype = "";
    psize = "";
    plabel = "";
    ptypesub = "";
  }

  var page = +req.query.page || 1;
  let totalItems;
  let catName = [];
  Categories.find({}, (err, cats) => {
    cats.forEach(cat => {
      catName.push(cat.name);
    });
  });

  let childType;
  if (productType == undefined) {
    productType = "";
  } else {
    Categories.findOne({ name: `${productType}` }, (err, data) => {
      if (err) console.log(err);
      if (data) {
        childType = data.childName || "";
      } else {
        childType = "";
      }
    });
  }

  if (productChild == undefined) {
    productChild = "";
  }

  Products.find({
    "productType.main": new RegExp(productType, "i"),
    "productType.sub": new RegExp(productChild, "i"),
    size: new RegExp(psize, "i"),
    price: { $gt: plowerprice, $lt: pprice },
    labels: new RegExp(plabel, "i")
  })
    .countDocuments()
    .then(numProduct => {
      totalItems = numProduct;
      return Products.find({
        "productType.main": new RegExp(productType, "i"),
        "productType.sub": new RegExp(productChild, "i"),
        size: new RegExp(psize, "i"),
        price: { $gt: plowerprice, $lt: pprice },
        labels: new RegExp(plabel, "i")
      })
        .skip((page - 1) * ITEM_PER_PAGE)
        .limit(ITEM_PER_PAGE)
        .sort({
          price
        });
    })
    .then(products => {
      res.render("products", {
        title: "Danh sách sản phẩm",
        user: req.user,
        allProducts: products,
        currentPage: page,
        categories: catName,
        currentCat: productType,
        currentChild: productChild,
        categoriesChild: childType,
        hasNextPage: ITEM_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEM_PER_PAGE),
        ITEM_PER_PAGE: ITEM_PER_PAGE,
        sort_value: sort_value,
        cartProduct: cartProduct
      });
    })
    .catch(err => {
      console.log(err);
    });
 });

router.post("/products/:productType*?", function (req, res, next) { 
  ITEM_PER_PAGE = parseInt(req.body.numItems);
  res.redirect("back");
 });



router.get("/search", function (req, res, next) { 
  var cartProduct;
  if (!req.session.cart) {
    cartProduct = null;
  } else {
    var cart = new Cart(req.session.cart);
    cartProduct = cart.generateArray();
  }
  searchText =
    req.query.searchText !== undefined ? req.query.searchText : searchText;
  const page = +req.query.page || 1;

  Products.createIndexes({}).catch(err => {
    console.log(err);
  });
  Products.find({
    $text: { $search: searchText }
  })
    .countDocuments()
    .then(numProduct => {
      totalItems = numProduct;
      return Products.find({
        $text: { $search: searchText }
      })
        .skip((page - 1) * 12)
        .limit(12);
    })
    .then(products => {
      res.render("search-result", {
        title: "Kết quả tìm kiếm cho " + searchText,
        user: req.user,
        searchProducts: products,
        searchT: searchText,
        currentPage: page,
        hasNextPage: 12 * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / 12),
        cartProduct: cartProduct
      });
    })
    .catch(err => {
      console.log(err);
    });
 });

// Xử lý Cart

router.get("/shopping_cart", function (req, res, next) { 
  var cartProduct;
  if (!req.session.cart) {
    cartProduct = null;
  } else {
    var cart = new Cart(req.session.cart);
    cartProduct = cart.generateArray();
  }
  res.render("shopping-cart", {
    title: "Giỏ hàng",
    user: req.user,
    cartProduct: cartProduct
  });
 });

router.get("/add-to-cart/:productId", function (req, res, next) { 
  var prodId = req.params.productId;
  var cart = new Cart(req.session.cart ? req.session.cart : {});
  Products.findById(prodId, (err, product) => {
    if (err) {
      return res.redirect("back");
    }
    cart.add(product, prodId);
    req.session.cart = cart;
    if (req.user) {
      req.user.cart = cart;
      req.user.save();
    }
    res.redirect("back");
  });
 });

router.get("/modify-cart", function (req, res, next) { 
  var prodId = req.query.id;
  var qty = req.query.qty;
  if (qty == 0) {
    return res.redirect("back");
  }
  var cart = new Cart(req.session.cart ? req.session.cart : {});
  Products.findById(prodId, (err, product) => {
    if (err) {
      return res.redirect("back");
    }
    cart.changeQty(product, prodId, qty);
    req.session.cart = cart;
    if (req.user) {
      req.user.cart = cart;
      req.user.save();
    }
    res.redirect("back");
  });
 });

router.get("/add-order", function (req, res, next) {
  var cartProduct;
  if (!req.session.cart) {
    cartProduct = null;
  } else {
    var cart = new Cart(req.session.cart);
    cartProduct = cart.generateArray();
  }
  res.render("add-address", {
    title: "Thông tin giao hàng",
    user: req.user,
    cartProduct: cartProduct
  });
  });

router.post("/add-order", async (req, res, next) => { 
  console.log(req.session.cart);
  if (req.session.cart.totalQty) {
    var order = new Order({
      user: req.user,
      cart: req.session.cart,
      address: req.body.address,
      phoneNumber: req.body.phone
    });

    for (var id in req.session.cart.items) {
      await Products.findOne({ _id: id })
        .then(product => {
          product.buyCounts += parseInt(req.session.cart.items[id].qty);
          product.save();
        })
        .catch(err => console.log(err));
    }

    order.save((err, result) => {
      req.flash("success", "Thanh toán thành công!");
      req.session.cart = null;
      req.user.cart = {};
      req.user.save();
      res.redirect("/account");
    });
  } else {
    req.flash("error", "Giỏ hàng rỗng!");
    res.redirect("/account");
  }
 });

router.get("/delete-cart", function (req, res, next) { 
  req.session.cart = null;
  if (req.user) {
    req.user.cart = {};
    req.user.save();
  }
  res.redirect("back");
 });

router.get("/delete-item/:productId", function (req, res, next) { 
  var prodId = req.params.productId;
  var cart = new Cart(req.session.cart ? req.session.cart : {});
  Products.findById(prodId, (err, product) => {
    if (err) {
      return res.redirect("back");
    }
    cart.deleteItem(prodId);
    req.session.cart = cart;
    if (req.user) {
      req.user.cart = cart;
      req.user.save();
    }
    console.log(req.session.cart);
    res.redirect("back");
  });
 });

router.get("/merge-cart", function (req, res, next) {
  if (req.user.cart != {} && req.user.cart) {
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    cart = cart.addCart(req.user.cart);
    req.session.cart = cart;
    req.user.cart = cart;
    req.user.save();
  }
  res.redirect("/");
  });

// Quản lý sản phẩm
var mongoose = require('mongoose');
router.get("/addProduct", function(req, res, next){
  var cartProduct;
  if (!req.session.cart) {
    cartProduct = null;
  } else {
    var cart = new Cart(req.session.cart);
    cartProduct = cart.generateArray();
  }
  res.render("addProduct", {
    title: "Thêm",
    cartProduct: cartProduct
    
  });
});

// Post cho ảnh
var multer  = require('multer');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now()+ '-' + file.originalname)
    }
  })
var upload = multer({ storage: storage });
// router.post('/addProduct', upload.any(), function(req, res, next) {
//     images.pop(req.files[0].path); // đưa path của img vào mảng images
//     images.push(req.files[0].path); // đưa path của img vào mảng images
//     res.status(200).send(req.files); // gửi mã 200 khi up thành công
//   });  
router.post('/upimage', upload.any(), function(req, res, next) {
    images.push(req.files[0].path); // đưa path của img vào mảng images
    console.log(images);
    res.status(200).send(req.files); // gửi mã 200 khi up thành công
  });

router.post("/addProduct", function(req, res, next){
  var product = new Products({
        "name": req.body.name,
        "description": req.body.description,
        "price": req.body.price,
        "stock": req.body.stock,
        "size": req.body.size,
        "images": images,
      }); 
      product.save();
      res.redirect("/");
});
router.get("/viewProduct", function(req, res, next){
  Products.find({}, function(err, product){
  res.render("viewProduct", {
    title: "View",
    prod: product
  });
})
});



module.exports = router;
