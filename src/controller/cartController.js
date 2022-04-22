const userModel = require("../model/userModel")
const CartModel = require('../model/cartModel');
const ProductModel = require('../model/productModel');
const mongoose = require('mongoose');

const isValidObjectId = (ObjectId) => {
    return mongoose.Types.ObjectId.isValid(ObjectId);
}

const isValidBody = function (requestBody) {
    return Object.keys(requestBody).length > 0;
}


const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false 
    
    return true;
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
          
            if (status===true) {
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


const updateCart = async function (req, res) {
    try {
        let userId = req.params.userId

        let { productId, cartId , removeProduct } = req.body
        let body = req.body
        const requiredParams = ['cartId', 'productId', 'removeProduct'];

        for (let i = 0; i < requiredParams.length; i++) {
            if (!body[requiredParams[i]] && body[requiredParams[i]] == undefined) {
                return res.status(400).send({ status: false, message: `${requiredParams[i]} field is required` });
            }
        }
        // if (!isValid(body)) {
        //     return res.status(400).send({ status: false, msg: "body should not be empty" })
        // }
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, msg: "userId is not valid" })
        }
        // if (!isValid(productId)) {
        //     return res.status(400).send({ status: false, msg: "productId should not be empty" })
        // }
        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, msg: "productId is not valid" })
        }
        // if (!isValid(cartId)) {
        //     return res.status(400).send({ status: false, msg: "cartId should not be empty" })
        // }

        if (!isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, msg: "cartId is not valid" })
        }

        const userExist = await userModel.findById({ _id: userId })
        if (!userExist) {
            return res.status(400).send({ status: false, msg: "user does not exist" })
        }

        const cartExists = await CartModel.findById({ _id: cartId })
        if (!cartExists) {
            return res.status(400).send({ status: false, msg: "cart does not exist" })
        }

        const productExist = await ProductModel.findById({ _id: productId, isDeleted: false })
        if (!productExist) {
            return res.status(400).send({ status: false, msg: "product does not exist" })
        }
        const cart = cartExists.items
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].productId == productId) {
                const newPrice = cart[i].quantity * productExist.price
                if (removeProduct == 0) {
                    const removeProduct = await CartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } }, totalPrice: cartExists.totalPrice - newPrice, totalItems: cartExists.totalItems - 1 }, { new: true })
                    return res.status(200).send({ status: true, msg: "Removed product successfully", data: removeProduct })
                }
                if (removeProduct == 1) {
                    if (cart[i].quantity == 1 && removeProduct == 1) {
                        const priceUpdate = await CartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId } }, totalPrice: cartExists.totalPrice - newPrice, totalItems: cartExists.totalItems - 1 }, { new: true })
                        return res.status(200).send({ status: true, msg: "Successfully removed product or cart is empty", data: priceUpdate })
                    }
                    cart[i].quantity = cart[i].quantity - 1
                    const updatedCart = await CartModel.findByIdAndUpdate({ _id: cartId }, { items: cart, totalPrice: cartExists.totalPrice - productExist.price }, { new: true })
                    return res.status(200).send({ status: true, msg: "sucessfully decremented the product", data: updatedCart })
                }
            }
            }
            } catch (err) {
                return res.status(500).send({ status: false, msg: err.message })
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
