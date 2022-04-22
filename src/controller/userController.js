const userSchema = require('../model/userModel');
const aws = require('../AWS/aws');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const isValidObjectId = (ObjectId) => {
    return mongoose.Types.ObjectId.isValid(ObjectId);
}

const register = async (req, res) => {
    try {
        const data = req.body;
        const file = req.files;

        const requiredFields = ['fname', 'lname', 'email', 'phone', 'password', 'address.shipping.street', 'address.shipping.city', 'address.shipping.pincode', 'address.billing.street', 'address.billing.city', 'address.billing.pincode'];

        for (let i = 0; i < requiredFields.length; i++) {
            if (data[requiredFields[i]] === undefined) {
                return res.status(400).send({ status: false, message: `${requiredFields[i]} field is required` });
            }
            else if (data[requiredFields[i]].trim() === "null" || data[requiredFields[i]].trim() == '') {
                return res.status(400).send({ status: false, message: ` Please enter valid data` });
            }
        }

        if (!(/^\w+([\.-]?\w+)@\w+([\. -]?\w+)(\.\w{2,3})+$/).test(data.email.trim())) {
            return res.status(400).send({ status: false, message: 'Enter a valid Email Id' });
        }

        let isDuplicateEmail = await userSchema.findOne({ email: data.email })
        if (isDuplicateEmail) {
            return res.status(400).send({ status: false, msg: "email already exists" })
        }


        if (!(/^[6789]\d{9}$/).test(data.phone.trim())) {
            return res.status(400).send({ status: false, message: 'The mobile number must be 10 digits and should be only Indian number' });
        }

        let duplicateMobile = await userSchema.findOne({ phone: data.phone })
        if (duplicateMobile) {
            return res.status(400).send({ status: false, msg: "mobile number already exists" })
        }

        if (!(/^\d{6}$/).test(data['address.shipping.pincode'])) {
            return res.status(400).send({ status: false, message: 'Enter the valid Pincode of address.shipping.pincode' });
        }


        if (!(/^\d{6}$/).test(data['address.billing.pincode'])) {
            return res.status(400).send({ status: false, message: 'Enter the valid Pincode of address.billing.pincode' });
        }

        if (!(data.password.length > 8 && data.password.length <= 15)) {
            return res.status(400).send({status: false,message: 'Minimum password should be 8 and maximum will be 15'});
        }

        if (file && file.length > 0) {
            if (file[0].mimetype.indexOf('image') == -1) {
                return res.status(400).send({ status: false, message: 'Only image files are allowed !' })
            }
            const profile_url = await aws.uploadFile(file[0]);
            data.profileImage = profile_url;
        }
        else {
            return res.status(400).send({ status: false, message: 'Profile Image is required !' })
        }
         data.password = bcrypt.hashSync(data.password, 10);
        
        const dataRes = await userSchema.create(data);
        console.log(dataRes)
        delete(dataRes.password)
        return res.status(201).send({ status: true, message: "User created successfully", data: dataRes });

        
    } catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }
}

const login = async (req, res) => {
    try {
        const data = req.body;
        const { email, password } = data;

        if (Object.keys(data).length == 0) {return res.status(400).send({status: false,message: 'Email and Password fields are required'});
        }

        if (email===undefined || email.trim() == '') {
            return res.status(400).send({status: false,message: 'Email field is required ' });
        }

        if (password===undefined|| password.trim() == '') {
             return res.status(400).send({status: false,message: 'Password field is required '});
        }

        if (!(/^\w+([\.-]?\w+)@\w+([\. -]?\w+)(\.\w{2,3})+$/).test(data.email.trim())) {
            return res.status(400).send({ status: false, message: 'Enter a valid Email Id' });
        }
    
        const userRes = await userSchema.findOne({ email: email});
        if (!userRes) {
            return res.status(401).send({ status: false,message: 'Document does not exist with this email'});
        }
        bcrypt.compare(password, userRes.password, (err,result) => {
            if (result === true) {
                const userID = userRes._id
            const payLoad = { userId: userID }
            const secretKey = "group17project"

            // creating JWT

            const token = jwt.sign(payLoad, secretKey, { expiresIn: "20hr" })

            res.header("Authorization", "bearer" + " " + token)

            res.status(200).send({ status: true, message: " user login successful", data: { userId: payLoad.userId, token: token } })

            } else{
                return res.status(400).send({ status: false, message: "incorrect password" })
            }
        })
    } catch (err) {
        return res.status(500).send({status: false,error: err.message});
    }
}

const getUserProfile = async (req, res) => {
    try {
        const userId = req.params.userId;

        if(!isValidObjectId(userId)){
            return res.status(400).send({status:false,message:`${userId} is not a valid userId`})
        }



        const userRes = await userSchema.findById(userId,{password: 0 }).lean();
       
        return res.status(200).send({status: true, message: 'User profile details', data: userRes});

    

    } catch (err) {
        return res.status(500).send({status: false,error: err.message
        });
    }
}

const updateUserProfile = async (req, res) => {
    try {
        const userId = req.params.userId;
        const data = req.body;
        const keys = Object.keys(data);
        const file = req.files;

        for (let i = 0; i < keys.length; i++) {
            if (keys[i] == '_id') {
                return res.status(400).send({status: false,message: 'You are not able to update _id property'
                });
            }
            else {
                if (data[keys[i]].trim() == '') {
                    return res.status(400).send({status: false,message: `${keys[i]} should not be empty !`
                    });
                }
                else if (keys[i] == 'email') {
                    if (!(/^\w+([\.-]?\w+)@\w+([\. -]?\w+)(\.\w{2,3})+$/).test(data.email.trim())) {
                        return res.status(400).send({ status: false, message: 'Enter a valid Email Id' });
                    }
                }
                else if (keys[i] == 'phone') {
                    if (!(/^[6789]\d{9}$/).test(data.phone.trim())) {
                        return res.status(400).send({ status: false, message: 'The mobile number must be 10 digits and should be only Indian number' });
                    }
            
                }
                else if (keys[i] == 'address.shipping.pincode' || keys[i] == 'address.billing.pincode') {
                    const regex = /^\d{6}$/;
                    if (!regex.test(data[keys[i]])) {
                        return res.status(400).send({status: false,message: `Enter the valid Pincode of ${keys[i]}`});
                    }
                }
                else if (keys[i] == 'password') {
                    if (!(data.password.length > 8 && data.password.length <= 15)) {
                        return res.status(400).send({status: false,message: 'Minimum password should be 8 and maximum will be 15'});
                    }
                    data.password = bcrypt.hashSync(data.password, 10);
                }
            }
        }
          
        
        let duplicateMobile = await userSchema.findOne({ phone: data.phone })
        if (duplicateMobile) {
            return res.status(400).send({ status: false, msg: "mobile number already exists" })
        }

        
        let isDuplicateEmail = await userSchema.findOne({ phone: data.phone })
        if (isDuplicateEmail) {
            return res.status(400).send({ status: false, msg: "email already exists" })
        }

        if (file && file.length > 0) {
            if (file[0].mimetype.indexOf('image') == -1) {
                return res.status(400).send({status:false,message:'Only image files are allowed !'});
            }
            const profile_url = await aws.uploadFile(file[0]);
            data.profileImage = profile_url;
        }
        

        const updateRes = await userSchema.findByIdAndUpdate(userId, data, { new: true });
        return res.status(200).send({status: true,message: `${Object.keys(data).length} field has been updated successfully !`,data: updateRes});
    } catch (err) {
   return res.status(500).send({status: false,error: err.message});
}
}
module.exports = {
    register,
    login,
    getUserProfile,
    updateUserProfile
}
