const cartModel = require('../model/cartModel')
const mongoose = require("mongoose")
const productModel = require('../model/productModel');
const userModel = require('../model/userModel')
const orderModel = require('../model/orderModel')


const createOrder = async function (req, res) {
    try {
        let userId = req.params.userId
        let data = req.body

        const placeOrder = await orderModel.create({ userId: userId, data: data })
        return res.status(200).send({ status: true, message: 'order placed', data: placeOrder });

    } catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }

}

module.exports.createOrder = createOrder