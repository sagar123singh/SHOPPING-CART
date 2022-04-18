const express = require('express');
const router = express.Router();


const userController = require('../controller/userController');
const productController = require('../controller/productController');
const cartController = require("../controller/cartController")
const orderController = require("../controller/orderController")
const authMiddleware = require('../middleware/auth.middleware');

router.post('/register', userController.register);
router.post('/login', userController.login);

router.get('/user/:userId/profile', authMiddleware.authenticate, authMiddleware.authorisation, userController.getUserProfile);
router.put('/user/:userId/profile', authMiddleware.authenticate, authMiddleware.authorisation, userController.updateUserProfile);

router.post('/products', productController.createProduct);
router.get('/products', productController.getProudcts); 
router.get('/products/:productId', productController.getProductById);
router.put('/products/:productId', productController.updateProductById);
router.delete('/products/:productId', productController.deleteProductById);


router.post('/users/:userId/cart',authMiddleware.authenticate, authMiddleware.authorisation, cartController.createCart);
router.get('/users/:userId/cart',authMiddleware.authenticate, authMiddleware.authorisation, cartController.getCart);
router.put('/users/:userId/cart',authMiddleware.authenticate, authMiddleware.authorisation, cartController.updateCart);
router.delete('/users/:userId/cart',authMiddleware.authenticate, authMiddleware.authorisation, cartController.deleteCart);

router.post('/users/:userId/cart',authMiddleware.authenticate, authMiddleware.authorisation, orderController.createOrder);


module.exports = router;
// updateCart