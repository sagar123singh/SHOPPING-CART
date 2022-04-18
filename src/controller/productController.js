const productSchema = require('../model/productModel');
const aws = require('../AWS/aws');
const mongoose = require('mongoose');

const isValidObjectId = (ObjectId) => {
    return mongoose.Types.ObjectId.isValid(ObjectId)

}

const createProduct = async (req, res) => {
    try {
        const data = req.body;
        const file = req.files;

        const requiredFields = ['title', 'description', 'price', 'currencyId'];
        for (let i = 0; i < requiredFields.length; i++) {
            if (data[requiredFields[i]] === undefined) {
                return res.status(400).send({ status: false, message: `${requiredFields[i]} field is required` });
            }
            else if (data[requiredFields[i]].trim() === "null" || data[requiredFields[i]].trim() == '') {
                return res.status(400).send({ status: false, message: `Please enter valid ${requiredFields[i]} ` });
            }
        }
        const isTitleAlreadyUsed = await productSchema.findOne({ title: data.title })
        if (isTitleAlreadyUsed) {
            return res.status(400).send({ status: false, message: "Title is already used" })
        }

        //    const keys = Object.keys(data);
        //    console.log(keys)
        //    console.log(keys.length)
        // if (keys.length > 0) {
        //     const Enum = ["S", "XS", "M", "X", "L", "XXL", "XL"];
        //     for (let i = 0; i < keys.length; i++) {
        //         if(keys[i]=='availableSizes'){
        //         if (!Enum.includes(data[keys[i]])) {
        //             return res.status(400).send({status: false, message: `availableSizes should be in enum" [${Enum.join(", ")}]`});
        //         }


        if (file && file.length > 0) {
            if (file[0].mimetype.indexOf('image') == -1) {
                return res.status(400).send({ status: false, message: 'Only image files are allowed !' });
            }
            const profile_url = await aws.uploadFile(file[0]);
            data.productImage = profile_url;
        }
        else {
            return res.status(400).send({ status: false, message: 'Product Image field is required' });
        }
        const insertRes = await productSchema.create(data);
        return res.status(201).send({ status: true, message: "Product created  successfully", data: insertRes });
    } catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }
}

const getProudcts = async (req, res) => {
    try {
        const data = req.query;
        const keys = Object.keys(data);
        if (keys.length > 0) {
            const requiredParams = ['size', 'name', 'priceGreaterThan', 'priceLessThan'];

            for (let i = 0; i < keys.length; i++) {
                if (!requiredParams.includes(keys[i])) {
                    return res.status(400).send({ status: false, message: `Only these Query Params are allowed [${requiredParams.join(", ")}]` });
                }
            }

            let queryData = {};
            for (let i = 0; i < keys.length; i++) {
                if (keys[i] == 'size') {
                    queryData.availableSizes = data.size;
                }
                else if (keys[i] == 'name') {
                    queryData.title = {
                        $regex: new RegExp(`${data.name}`)
                    };
                }
                else if (keys[i] == 'priceGreaterThan') {
                    queryData.price = {
                        $gt: data.priceGreaterThan
                    }
                }
                else if (keys[i] == 'priceLessThan') {
                    queryData.price = {
                        $lt: data.priceLessThan
                    }
                    
                }
            }
            if (data['priceGreaterThan'] && data['priceLessThan']) {
                queryData.price = {
                    $gt: data.priceGreaterThan,
                    $lt: data.priceLessThan
                }
            }
            queryData.isDeleted = false;
            queryData.deletedAt = null;

            const filterData = await productSchema.find(queryData).sort({ price: 1 });
            if (filterData.length == 0) {
                return res.status(404).send({ status: false, message: 'Product not found !' });
            }

            return res.status(200).send({ status: true, message: 'fetch success', count: filterData.length, data: filterData });

        }
        else {
            const fetchAllProducts = await productSchema.find({ isDeleted: false, deletedAt: null }).sort({ price: 1 });
            if (fetchAllProducts.length == 0) {
                return res.status(404).send({ status: false, message: 'Product not found !' });
            }
            return res.status(200).send({ status: true, message: 'fetch success', count: fetchAllProducts.length, data: fetchAllProducts });
        }
    } catch (err) {
        return res.status(500).send({ status: false, error: err.message });
    }
}

const getProductById = async (req, res) => {
    try {
        const productId = req.params.productId;
        if (!isValidObjectId(productId.trim())) {
            return res.status(400).send({ status: false, message: 'Invalid ID !' });
        }

        const productRes = await productSchema.findById(productId);
        if (!productRes) {
            return res.status(404).send({ status: false, message: 'Product not found !' });
        }
        if (productRes.isDeleted === true && productRes.deletedAt != null) {
            return res.status(404).send({ status: false, message: 'Product not found !' });
        }

        return res.status(200).send({ status: true, message: "Success", data: productRes });

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

const updateProductById = async (req, res) => {
    try {
        const productId = req.params.productId;
        const data = req.body;
        const keys = Object.keys(data);
        const file = req.files;

        if (!isValidObjectId(productId.trim())) {
            return res.status(400).send({ status: false, message: 'Invalid ID !' });
        }
        const productRes = await productSchema.findById(productId);
        if (!productRes) {
            return res.status(404).send({ status: false, message: 'Product not found !' });
        }
        if (productRes.isDeleted === true && productRes.deletedAt != null) {
            return res.status(404).send({ status: false, message: 'Product not found !' });
        }
        for (let i = 0; i < keys.length; i++) {
            if (keys[i] == '_id') {
                return res.status(400).send({ status: false, message: 'You are not allow to update id property' });
            }
            else if(data[keys[i]].trim() == '') {
                    return res.status(400).send({ status: false, message: `${keys[i]} should not be empty !` });
                }
            }
            for (let i = 0; i < keys.length; i++) {
                if (keys[i] == 'availableSizes') {
                    const defaultSize = ["S", "XS", "M", "X", "L", "XXL", "XL"];
                            if (data.availableSizes.length > 0) {
                                if (!defaultSize.includes(data.availableSizes[i])) {
                                    return res.status(400).send({status: false, message: `Only these Query Params are allowed [${defaultSize.join(", ")}]`});
                                }
                            }
                        }
                    }
                   

            const isTitleAlreadyUsed = await productSchema.findOne({ title: data.title })
            if (isTitleAlreadyUsed) {
                return res.status(400).send({ status: false, message: "Title is already used" })
            }

            if (file && file.length > 0) {
                if (file[0].mimetype.indexOf('image') == -1) {
                    return res.status(400).send({ status: false, message: 'Only image files are allowed !' });
                }
                const profile_url = await aws.uploadFile(file[0]);
                data.productImage = profile_url;
            }
            const updateRes = await productSchema.findByIdAndUpdate(productId, data, { new: true });
            return res.status(200).send({ status: true, message: `${Object.keys(data).length} field has been updated successfully !`, data: updateRes });

        } catch (err) {
            res.status(500).send({ status: false, error: err.message })
        }
    }
const deleteProductById = async (req, res) => {
        try {
            const productId = req.params.productId;

            if (!isValidObjectId(productId.trim())) {
                return res.status(400).send({ status: false, message: 'Invalid ID !' });
            }
            const productRes = await productSchema.findById(productId);
            if (!productRes) {
                return res.status(404).send({ status: false, message: 'Product not found !' });
            }
            if (productRes.isDeleted && productRes.deletedAt != null) {
                return res.status(404).send({ status: false, message: 'Product not found !' });
            }

            const deleteRes = await productSchema.findByIdAndUpdate(productId, { isDeleted: true, deletedAt: new Date() }, { new: true });
            return res.status(200).send({ status: true, message: `Delete success`, data: deleteRes });
        } catch (error) {
            return res.status(500).send({ status: false, message: error.message });
        }
    }

    module.exports = {
        createProduct,
        getProudcts,
        getProductById,
        updateProductById,
        deleteProductById
    }