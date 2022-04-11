const UserModel = require("../Models/UserModel")
const mongoose = require("mongoose")
const aws = require("aws-sdk")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const validator = require('../Validator/validation');


// ************************************************************* POST /register ************************************************************ //

const createUser = async function(req,res) {
    try{
        const body = req.body;
        //Validate body 
        if (!validator.isValidBody(body)) {
            return res.status(400).send({ status: false, msg: "User body should not be empty" });
        }

        // Validate query (it must not be present)
        const query = req.query;
        if(validator.isValidBody(query)) {
            return res.status(400).send({ status: false, msg: "Invalid parameters"});
        }

        // Validate params (it must not be present)
        const params = req.params;
        if(validator.isValidBody(params)) {
            return res.status(400).send({ status: false, msg: "Invalid parameters"});
        }


        const {fname, lname, email, profileImage, password, phone, address} = body

        // Validate fname
        if(!validator.isValid(fname.trim())) {
            return res.status(400).send({status: false, message: "fname must be present"})
        }

        // Validate lname
        if(!validator.isValid(lname.trim())) {
            return res.status(400).send({status: false, message: "lname must be present"})
        }

        // Validate email
        if(!validator.isValid(email.trim())) {
            return res.status(400).send({status: false, message: "email must be present"})
        }

        // Validation of email id
        if(!validator.isValidEmail(email.trim())) {
            return res.status(400).send({status: false, message: "Invalid email id"})
        }

        // Validate profileImage
        if(!validator.isValid(profileImage.trim())) {
            return res.status(400).send({status: false, message: "profileImage is required"})
        }

        // Validate password
        if(!validator.isValid(password.trim())) {
            return res.status(400).send({status: false, message: "password must be present"})
        }

        // Validation of password
        if(!validator.isValidPassword(password.trim())) {
            return res.status(400).send({status: false, message: "Invalid password"})
        }

        // Validate address
        if(!validator.isValid(address)) {
            return res.status(400).send({status: false, message: "Address is required"})
        }

        // Validate shipping address
        if(!validator.isValid(address.shipping)) {
            return res.status(400).send({status: false, message: "Shipping address is required"})
        }

        // Validate street, city, pincode of shipping
        if(!validator.isValid(address.shipping.street && address.shipping.city && address.shipping.pincode)) {
            return res.status(400).send({status: false, message: "Shipping address details is/are missing"})
        }

        // Validate billing address
        if(!validator.isValid(address.billing)) {
            return res.status(400).send({status: false, message: "Billing address is required"})
        }

        // Validate street, city, pincode of billing
        if(!validator.isValid(address.billing.street && address.billing.city && address.billing.pincode)) {
            return res.status(400).send({status: false, message: "Billing address details is/are missing"})
        }


        // Duplicate entries
        const isAlredyUsed = await UserModel.findOne({phone}, {email});
        if(isAlredyUsed) {
            return res.status(400).send({status: false, message: `${phone} number or ${email} mail is already registered`})
        }

        // encrypted password
        const encyptPassword = await bcrypt.hash(password,10)

        const userData = {fname, lname, email, profileImage, phone, password: encyptPassword, address}
        const savedData = await UserModel.create(userData)
        return res.status(201).send({status: true, message: "User created successfully", data: savedData})

        
    }
    catch (err) {
        console.log("This is the error :", err.message)
        res.status(500).send({ msg: "Error", error: err.message })
    }
}

module.exports.createUser = createUser





// ************************************************************ POST /login ************************************************************ //

const login = async function(req,res) {
    try {
        const body = req.body;
        //Validate body 
        if (!validator.isValidBody(body)) {
            return res.status(400).send({ status: false, msg: "User body should not be empty" });
        }

        // Validate query (it must not be present)
        const query = req.query;
        if(validator.isValidBody(query)) {
            return res.status(400).send({ status: false, msg: "Invalid parameters"});
        }

        // Validate params (it must not be present)
        const params = req.params;
        if(validator.isValidBody(params)) {
            return res.status(400).send({ status: false, msg: "Invalid parameters"});
        }


        let email = body.email;
        let password = body.password;

        // Validate email
        if(!validator.isValid(email.trim())) {
            return res.status(400).send({status: false, message: "email must be present"})
        }

        // Validation of email id
        if(!validator.isValidEmail(email.trim())) {
            return res.status(400).send({status: false, message: "Invalid email id"})
        }

        // Validate password
        if(!validator.isValid(password.trim())) {
            return res.status(400).send({status: false, message: "password must be present"})
        }

        // Validation of password
        if(!validator.isValidPassword(password.trim())) {
            return res.status(400).send({status: false, message: "Invalid password"})
        }


        if(email && password) {
            let user = await UserModel.findOne({email})
            if(!user) {
                return res.status(400).send({status: false, message: "Email doesnot exist. Kindly create a new user"})
            }

            let pass = await bcrypt.compare(password, user.password);
            if(pass) {
                const Token = jwt.sign({
                    userId:user._id,
                    iat: Math.floor(Date.now() / 1000), //issue date
                    exp: Math.floor(Date.now() / 1000) + 30*60 //expiry date and time (30*60 = 30 min)
                }, "Group37")
                res.header('x-api-key', Token)

                return res.status(200).send({status: true, message: "User login successfull", data: {userId: user._id, token:Token}})
            }
            else {
                return res.status(400).send({status: false, message:"Invalid password"})
            }
        }

    }
    catch (err) {
        console.log("This is the error :", err.message)
        res.status(500).send({ msg: "Error", error: err.message })
    }
}

module.exports.login = login