const UserModel = require("../Models/UserModel")
const mongoose = require("mongoose")
const aws = require("aws-sdk")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const validator = require('../Validator/validation');


// ****************************************************************** AWS-S3 ****************************************************************** //

aws.config.update({
    accessKeyId: "AKIAY3L35MCRVFM24Q7U",  // id
    secretAccessKey: "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",  // secret password
    region: "ap-south-1" 
  });
  
  
  // this function uploads file to AWS and gives back the url for the file
  let uploadFile = async (file) => {
    return new Promise(function (resolve, reject) { 
      
      let s3 = new aws.S3({ apiVersion: "2006-03-01" });
      var uploadParams = {
        ACL: "public-read", 
        Bucket: "classroom-training-bucket", // HERE
        Key: "group37/profileImages/" + file.originalname, // HERE    
        Body: file.buffer, 
      };
  
      s3.upload(uploadParams , function (err, data) {
        if (err) {
          return reject( { "error": err });
        }
        console.log(data)
        console.log("File uploaded successfully.");
        return resolve(data.Location); //HERE 
      });
    });
  };


// ************************************************************* POST /register ************************************************************ //

const createUser = async function(req,res) {
    try{
        const body = req.body
        // const body = req.body.data;
        // const JSONbody = JSON.parse(body)

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


        const {fname, lname, email, password, phone, address} = body

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


        let files = req.files;
        if (files && files.length > 0) {
        let uploadedFileURL = await uploadFile( files[0] );  
        // res.status(201).send({ status: true,msg: "file uploaded succesfully", data: uploadedFileURL });

        // encrypted password
        const encryptPassword = await bcrypt.hash(password,10)

        profileImage = uploadedFileURL

        const userData = {fname, lname, email, profileImage, phone, password: encryptPassword, address}
        const savedData = await UserModel.create(userData)
        return res.status(201).send({status: true, message: "User created successfully", data: savedData})
        }
        else {
            return res.status(400).send({ status: false, msg: "No file to write" });
        }
        
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
                    exp: Math.floor(Date.now() / 1000) + 60*60 //expiry date and time (30*60 = 30 min || 60*60 = 1 hr)
                }, "Group37")
                // res.header('x-api-key', Token)

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





// ******************************************************* GET /user/:userId/profile ******************************************************* //

const getUser = async function(req,res) {
    try {
        // Validate of body(It must not be present)
        const body = req.body;
        if(validator.isValidBody(body)) {
            return res.status(400).send({ status: false, msg: "Body must not be present"})
        }

        // Validate query(it must not be present)
        const query = req.query;
        if(validator.isValidBody(query)) {
            return res.status(400).send({ status: false, msg: "Query must not be present"})
        }

        // Validate params
        const params = req.params;
        if(!validator.isValidBody(params)) {
            return res.status(400).send({status: false, msg: "Credentials are required"})
        }

        let userId = req.params.userId

        if(req.user.userId != params.userId) {
            return res.status(401).send({ status: false, msg: "UserId doesnot match"})
        }

        let findUser = await UserModel.findOne({ _id: userId})
        if(findUser) {
            return res.status(200).send({status: true, msg: "User profile details", data:findUser})
        }

    }
    catch (err) {
        console.log("This is the error :", err.message)
        res.status(500).send({ msg: "Error", error: err.message })
    }
}

module.exports.getUser = getUser





// ******************************************************* /user/:userId/profile ******************************************************* //

const update = async function(req,res) {
    try {
        // Validate body
        const body = req.body
        // const reqBody = JSON.parse(req.body.data)
        if(!validator.isValidBody(body)) {
            return res.status(400).send({status: false, msg: "Details must be present to update"})
        }

        // Validate params
        userId = req.params.userId
        if(!validator.isValidobjectId(userId)) {
            return res.status(400).send({status: false, msg: `${userId} is invalid`})
        }

        const userFound = await UserModel.findOne({_id: userId})
        if(!userFound) {
            return res.status(404).send({status: false, msg: "User does not exist"})
        }


        // AUTHORISATION
        if(userId !== req.user.userId) {
            return res.status(401).send({status: false, msg: "Unauthorised access"})
        }

        // Destructuring
        let{fname, lname, email, phone, password, address} = body;
        let updatedData = {}
        if(validator.isValid(fname)) {
            updatedData['fname'] = fname
        }
        if(validator.isValid(lname)) {
            updatedData['lname'] = lname
        }

        // Updating of email
        if(validator.isValid(email)) {
            if(!validator.isValidEmail(email)) {
                return res.status(400).send({status: false, msg: "Invalid email id"})
            }

            // Duplicate email
            const duplicatemail = await UserModel.find({email:email})
            if(duplicatemail.length) {
                return res.status(400).send({status: false, msg: "email id already exist"})
            }
            updatedData['email'] = email
        }

        // Updating of phone
        if(validator.isValid(phone)) {
            if(!validator.isValidNumber(phone)) {
                return res.status(400).send({status: false, msg: "Invalid phone number"})
            }

            // Duplicate phone
            const duplicatePhone = await UserModel.find({phone:phone})
            if(duplicatePhone.length) {
                return res.status(400).send({status: false, msg: "phone number already exist"})
            }
            updatedData['phone'] = phone
        }

        // Updating of password
        if(validator.isValid(password)) {
            const encrypt = await bcrypt.hash(password, 10)
            updatedData['password'] = encrypt
        }

        // Updating address
        if (address) {
            if (address.shipping) {
                if (address.shipping.street) {
                    if (!validator.isValid(address.shipping.street)) {
                        return res.status(400).send({ status: false, message: 'Please provide street' })
                    }
                    updatedData['address.shipping.street'] = address.shipping.street
                }
                if (address.shipping.city) {
                    if (!validator.isValid(address.shipping.city)) {
                        return res.status(400).send({ status: false, message: 'Please provide city' })
                    }
                    updatedData['address.shipping.city'] = address.shipping.city
                }
                if (address.shipping.pincode) {
                    if (typeof address.shipping.pincode !== 'number') {
                        return res.status(400).send({ status: false, message: 'Please provide pincode' })
                    }
                    updatedData['address.shipping.pincode'] = address.shipping.pincode
                }
            }
            if (address.billing) {
                if (address.billing.street) {
                    if (!validator.isValid(address.billing.street)) {
                        return res.status(400).send({ status: false, message: 'Please provide street' })
                    }
                    updatedData['address.billing.street'] = address.billing.street
                }
                if (address.billing.city) {
                    if (!validator.isValid(address.billing.city)) {
                        return res.status(400).send({ status: false, message: 'Please provide city' })
                    }
                    updatedData['address.billing.city'] = address.billing.city
                }
                if (address.billing.pincode) {
                    if (typeof address.billing.pincode !== 'number') {
                        return res.status(400).send({ status: false, message: 'Please provide pincode' })
                    }
                    updatedData['address.billing.pincode'] = address.billing.pincode
                }
            }
        }

        aws.config.update({
        accessKeyId: "AKIAY3L35MCRVFM24Q7U",  // id
        secretAccessKey: "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",  // secret password
        region: "ap-south-1" 
        });


        // this function uploads file to AWS and gives back the url for the file
        let uploadFile = async (file) => {
        return new Promise(function (resolve, reject) { 
    
        let s3 = new aws.S3({ apiVersion: "2006-03-01" });
        var uploadParams = {
        ACL: "public-read", 
        Bucket: "classroom-training-bucket", // HERE
        Key: "group37/profileImages/" + file.originalname, // HERE    
        Body: file.buffer, 
        };

        s3.upload(uploadParams , function (err, data) {
            if (err) {
                return reject( { "error": err });
            }
            console.log(data)
            console.log("File uploaded successfully.");
            return resolve(data.Location); //HERE 
            });
        });
        };

        let files = req.files;
        if (files && files.length > 0) {
            let uploadedFileURL = await uploadFile( files[0] );
            if(uploadedFileURL) {
                updatedData['profileImage'] = uploadedFileURL
            }
        }
        const updated = await UserModel.findOneAndUpdate({_id:userId}, updatedData, {new:true})
        return res.status(201).send({status:true, data: updated})
    }
    catch (err) {
        console.log("This is the error :", err.message)
        res.status(500).send({ msg: "Error", error: err.message })
    }
}

module.exports.update = update