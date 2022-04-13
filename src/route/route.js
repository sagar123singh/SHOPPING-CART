const express = require('express');
const router = express.Router();

const userController = require('../controller/user.controller');
const productController = require('../controller/product.controller');

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

module.exports = router; 