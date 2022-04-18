const CartModel = require('../model/cartModel');
const ProductModel = require('../model/productModel');
const mongoose = require('mongoose');

const isValidObjectId = (ObjectId) => {
    return mongoose.Types.ObjectId.isValid(ObjectId);
}
const createCart = async (req, res) => {
    try {
        const data = req.body;
        const keys = Object.keys(data);
        let price = 0;

        if (!data.userId || data.userId.trim() == '') {
            return res.status(400).send({status: false,message: 'userId field is required'});
        }

        if (!isValidObjectId(data.userId)) {
            return res.status(400).send({status: false,message: 'Only mongodb object id is allowed !'});
        }
        if (data.userId != req.params.userId) {
            return res.status(400).send({status: false,message: 'userId must be same as route'});
        }
        const requiredParams = ['userId', 'items'];
        for (let i = 0; i < keys.length; i++) {
            if (!requiredParams.includes(keys[i])) {
                return res.status(400).send({status: false,message: `Only these body params are allowed ${requiredParams.join(", ")}`});
            }
            else if (keys[i] == 'items') {
                if (!data['items']) {
                    return res.status(400).send({status: false,message: 'items field should not be empty'});
                }
                else if (!(typeof data['items'] == 'object' && data['items'] !== null && !Array.isArray(data['items']))) {
                    return res.status(400).send({status: false,message: 'Only Object data are allowed'});
                }

                if (!data['items']['productId'] || data['items']['productId'].trim() == '') {
                    return res.status(400).send({status: false,message: 'product Id is required'});
                }

                if (!isValidObjectId(data['items']['productId'])) {
                    return res.status(400).send({status: false,message: 'Only mongodb object id is allowed !'});
                }
                const productRes = await ProductModel.findOne({'_id': data['items']['productId'],isDeleted: false,deletedAt: null});

                if (!productRes) {
                    return res.status(400).send({status: false,message: 'Product not found'});
                }
                price = productRes.price;
            }
        }

        const fetchCart = await CartModel.findOne({'userId': data.userId});
        if (fetchCart) {
            if (keys.length == 1) {
                return res.status(400).send({status: false,message: "Your empty cart is already created please add a product"});
            }
            let status = false;
            const previousItems = [];
            for (let i = 0; i < fetchCart.items.length; i++) {
                if (fetchCart.items[i].productId == data.items.productId) {
                    status = true;
                    previousItems.push({
                       productId: fetchCart.items[i].productId,
                        quantity: fetchCart.items[i].quantity + (data.items.quantity || 1)
                    });
                }
                else {
                    previousItems.push(fetchCart.items[i]);
                }
            }
            if (status) {
                const dataRes = await CartModel.findOneAndUpdate({userId: data.userId},{items: previousItems,$inc: {totalPrice: + price * (data.items.quantity || 1)}},{new: true}).select({items: {_id: 0}});

                return res.status(201).send({status: true,message: "success",data: dataRes});
            }
            else {
                const appendItems = [...fetchCart.items, data.items];
                const updatedPrice = fetchCart.totalPrice + price * (data.items.quantity || 1);
                const dataRes = await CartModel.findOneAndUpdate({userId: data.userId},{items: appendItems,totalPrice: updatedPrice,totalItems: appendItems.length},{new: true}).select({items: { _id: 0}});
                return res.status(201).send({status: true,message: "success",data: dataRes});
            }
        }
        else {
            if (data['items'] != undefined) {
                data.totalItems = 1;
                const keys = Object.keys(data['items']);
                if (!keys.includes('quantity')) {
                    price = price;
                }
                else {
                    price = price * data.items.quantity;
                }
            }
            data.totalPrice = price
            const cartRes = await CartModel.create(data);
            return res.status(201).send({status: true,message: "success",data: cartRes});
        }
    } catch (error) {
        return res.status(500).send({status: false,message: error.message});
    }
}

const updateCart = async (req, res) => {
    try {
        const data = req.body;
        const keys = Object.keys(data);
        const requiredParams = ['cartId', 'productId', 'removeProduct'];

        for (let i = 0; i < requiredParams.length; i++) {
            if (!data[requiredParams[i]] && data[requiredParams[i]] == undefined) {
                return res.status(400).send({status: false,message: `${requiredParams[i]} field is required`});
            }
        }

        for (let i = 0; i < keys.length; i++) {
            if (!requiredParams.includes(keys[i])) {
                return res.status(400).send({status: false,message: `Only these body params are allowed ${requiredParams.join(", ")}`});
            }
            if (keys[i] == 'cartId' || keys[i] == 'productId') {
                if (!isValidObjectId(data[keys[i]])) {
                    return res.status(400).send({status: false,message: `Only mongodb object id is allowed on ${keys[i]} !`});
                }
            }
        }
        if (data.removeProduct || data.removeProduct == 0) {
            if (typeof data.removeProduct != "number") {
                return res.status(400).send({status: false,message: 'Only number datatypes are allowed !'});
            }
            if (data.removeProduct == 0 || data.removeProduct == 1) {
                const cartRes = await CartModel.findById(data.cartId);
                if (!cartRes) {
                    return res.status(400).send({status: false,message: 'Cart not found !'});
                }

                if (data.removeProduct == 0) {
                    const previousItems = [];
                    let removePrice = 0;
                    let productStatus = false;
                    for (let i = 0; i < cartRes.items.length; i++) {
                        if (cartRes.items[i].productId == data.productId) {
                            productStatus = true;
                            const productRes = await ProductModel.findOne({'_id': data.productId,isDeleted: false,deletedAt: null});

                            if (!productRes) {
                                return res.status(400).send({status: false,message: 'Product not found'});
                            }
                            removePrice = productRes.price * cartRes.items[i].quantity;
                        }
                        else {
                            // productStatus = false;
                            previousItems.push(cartRes.items[i]);
                            productPrice = cartRes.totalPrice;
                        }
                    }
                    productPrice = cartRes.totalPrice - removePrice;
                    if (!productStatus) {
                        return res.status(400).send({status: false,message: 'Product not found in the Cart!'});
                    }
                    const removeRes = await CartModel.findOneAndUpdate({productId: data.productId}, {totalPrice: productPrice,totalItems: previousItems.length,items: previousItems}, {new: true});
                    return res.status(200).send({status: true,message: "Remove success",data: removeRes});
                }
                else {
                    const previousItems = [];
                    let productPrice = 0;
                    let productStatus = false;
                    for (let i = 0; i < cartRes.items.length; i++) {
                        if (cartRes.items[i].productId == data.productId) {
                            productStatus = true;
                            const productRes = await ProductModel.findOne({'_id': data.productId,isDeleted: false,deletedAt: null});

                            if (!productRes) {
                                return res.status(400).send({status: false,message: 'Product not found'});
                            }
                            if (cartRes.items[i].quantity == 1) {
                                productPrice = cartRes.totalPrice - productRes.price;
                            }
                            else {
                                previousItems.push({
                                    productId: data.productId,
                                    quantity: cartRes.items[i].quantity - 1
                                });
                                productPrice = cartRes.totalPrice - productRes.price;
                            }
                        }
                        else {
                            previousItems.push(cartRes.items[i]);
                        }
                    }
                    if (!productStatus) {
                        return res.status(400).send({status: false,message: 'Product not found in the Cart!'});
                    }
                    const reduceRes = await CartModel.findOneAndUpdate({productId: data.productId}, {totalPrice: productPrice,totalItems: previousItems.length,items: previousItems}, {new: true}).select({items: {_id: 0}});;
                    return res.status(200).send({status: false,message: "success",data: reduceRes});
                }
            }
            else {
                return res.status(400).send({status: false,message: 'removeProduct field contains only 0 or 1 !'});
            }
        }
    } catch (error) {
        return res.status(500).send({status: false,message: error.message});
    }
}

const getCart = async (req, res) => {
    try {
        const cartRes = await CartModel.findOne({userId: req.params.userId}).select({items: {_id: 0}});
        if (!cartRes) {
            return res.status(400).send({status: false,message: 'Cart not found !'});
        }
        if (cartRes.totalItems == 0 && cartRes.totalPrice == 0) {
            return res.status(404).send({status: true,message: 'Cart not found'});
        }

        return res.status(200).send({status: true,message: "success",data: cartRes});
    } catch (error) {
        return res.status(500).send({status: false,message: error.message});
    }
}

const deleteCart = async (req, res) => {
    try {
        const cartRes = await CartModel.findOne({userId: req.params.userId});
        if (!cartRes) {
            return res.status(400).send({status: false,message: 'Cart not found !'});
        }
        const deleteRes = await CartModel.findOneAndUpdate({userId: req.params.userId},{totalItems: 0,totalPrice: 0,items: []});

        return res.status(200).send({status: true,message: "Delete cart success"});
    } catch (error) {
        return res.status(500).send({status: false,message: error.message});
    }
}

module.exports = {
    createCart,
    updateCart,
    getCart,
    deleteCart}
