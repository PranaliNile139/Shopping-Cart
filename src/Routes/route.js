const express = require('express');
const router = express.Router();
const aws = require("aws-sdk");




// ************************************************************* Controllers ************************************************************* //
const userController = require('../controllers/UserController')

const middleware = require('../Middeware/auth')

const productController = require('../Controllers/ProductController')

const cartController = require('../Controllers/CartController')

const orderController = require('../Controllers/OrderController')


// ************************************************************* User Controller ********************************************************** //
router.post('/register', userController.createUser)

router.post('/login', userController.login)

router.get('/user/:userId/profile', middleware.auth, userController.getUser)

router.put('/user/:userId/profile', middleware.auth, userController.update)


// ************************************************************* Product Controller ********************************************************** //
router.post('/products', productController.createProduct)

router.get('/products', productController.getProduct)

router.get('/products/:productId', productController.getProductById)

router.put('/products/:productId', productController.updateProduct)

router.delete('/products/:productId', productController.deleteById)


// ************************************************************* Cart Controller ********************************************************** //
router.post('/users/:userId/cart', middleware.auth, cartController.createCart)

router.put('/users/:userId/cart', middleware.auth, cartController.updateCart)

router.get('/users/:userId/cart', middleware.auth, cartController.getCart)

router.delete('/users/:userId/cart', middleware.auth, cartController.deleteCart)


// ************************************************************* Order Controller ********************************************************** //
router.post('/users/:userId/orders', middleware.auth, orderController.createOrder)

router.put('/users/:userId/orders', middleware.auth, orderController.updateOrder)


module.exports = router;