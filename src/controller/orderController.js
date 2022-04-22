const OrderModel= require('../model/orderModel');
const mongoose = require('mongoose');

const isValidObjectId = (ObjectId) => {
    return mongoose.Types.ObjectId.isValid(ObjectId);
}

const createOrder = async (req, res) => {
    try {

        const data = req.body;

        const requiredFields = ['userId','items', 'totalPrice','totalItems'];

        for (let i = 0; i < requiredFields.length; i++) {
            if (data[requiredFields[i]] === undefined) {
                return res.status(400).send({ status: false, message: `${requiredFields[i]} field is required` });
            }
            
        }

        const { items } = data;

        if(!isValidObjectId(data.userId)){
            return res.status(400).send({status:false,message: `${data.userId} is not a valid user id`})

        }
    
       
        let totalQuantity = 0;
        for(let i=0;i<items.length;i++){
            totalQuantity += items[i].quantity;
        }
       
         data.totalQuantity = totalQuantity;

        const orderRes = await OrderModel.create(data);
        return res.status(201).send({status: true,message: "Order placed success",data: orderRes});
    } catch (error) {
        return res.status(500).send({status: false,message: error.message});
    }
}

const updateOrder = async (req, res) => {
    try {
        const data = req.body;
        const requiredParams = ['orderId', 'status'];
        for (let i = 0; i < requiredParams.length; i++) {
            if (!data[requiredParams[i]] || !data[requiredParams[i]].trim()) {
                return res.status(400).send({status: false,message: `${requiredParams[i]} field is required`});
            }
        }
        if (!isValidObjectId(data.orderId)) {
            return res.status(400).send({status: false,message: 'Only mongodb object id is allowed !'});
        }
        const orderRes = await OrderModel.findOne({_id: data.orderId,deletedAt: null,isDeleted: false});
        if (!orderRes) {
            return res.status(400).send({status: false,message: 'Order not found'});
        }
        const statusEnum = ['pending', 'completed', 'cancelled'];
        if (!statusEnum.includes(data.status)) {
            return res.status(400).send({status: false,message: `Only these params are allowed on status ${statusEnum.join(", ")}`});
        }
       
        if (orderRes.status == 'completed') {
            return res.status(200).send({status: true,message: 'Order is already completed'});
        }
        if (orderRes.status == 'cancelled') {
            return res.status(200).send({status: true,message: 'Order is already cancelled'});
        }
        const updateRes = await OrderModel.findByIdAndUpdate(data.orderId, {status: data.status,cancellable:false},{new: true});
        return res.status(200).send({status: true,message: "status update success",data: updateRes});
    }
    catch (error) {
        return res.status(500).send({status: false,message: error.message});
    }
}
module.exports = {
    createOrder,
    updateOrder
}