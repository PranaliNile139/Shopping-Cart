const ProductModel = require("../Models/ProductModel")
const aws = require("aws-sdk")
const mongoose = require("mongoose")
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


// ************************************************************* POST /products ************************************************************ //

const createProduct = async function(req,res) {
    try {
        const body = req.body
        // const body = req.body.data
        // const JSONbody = JSON.parse(body)

        // Validate body
        if(!validator.isValidBody(body)) {
            return res.status(400).send({ status: false, msg: "Product details must be present"})
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


        const {title, description, price, currencyId, currencyFormat,isFreeShipping,style, availableSizes,installments} = body

        // Validate title
        if(!validator.isValid(title.trim())) {
            return res.status(400).send({ status: false, msg: "Title is required"})
        }

        // Validate description
        if(!validator.isValid(description)) {
            return res.status(400).send({ status: false, msg: "Description is required"})
        }

        // Validate price
        if(!validator.isValidPrice(price)) {
        // if(typeof price !== "number") {
            return res.status(400).send({status: false, msg: "Invalid number"})
        }

        // Validate currencyId
        if(!validator.isValid(currencyId)) {
            return res.status(400).send({status: false, msg: "currencyId is required"})
        }

        // Validate currencyFormat
        if(!validator.isValid(currencyFormat)) {
            return res.status(400).send({ status: false, msg: "currencyFormat is required"})
        }

        // Validate availableSizes
        if(!validator.isValidSize(availableSizes)) {
            return res.status(400).send({status: false, msg: "Invalid Size"})
        }

        // Checking duplicate entry of title
        let duplicateTitle = await ProductModel.find({title:title})
        if(duplicateTitle.length != 0) {
            return res.status(400).send({status: false, msg: "Title already exist"})
        }

        let files = req.files;
        if (files && files.length > 0) {
        let uploadedFileURL = await uploadFile( files[0] );

        const product = {
            title, description, price, currencyId: "₹", currencyFormat: "INR",isFreeShipping, productImage: uploadedFileURL, style: style, availableSizes, installments
        }
        let productData = await ProductModel.create(product)
        return res.status(201).send({status: true, msg:"Product updated", data: productData})
        }
        else{
            return res.status(400).send({status: false, msg: "Product image is required"})
        }

    }
    catch (err) {
        console.log("This is the error :", err.message)
        res.status(500).send({ msg: "Error", error: err.message })
    }
}

module.exports.createProduct = createProduct





// ************************************************************* GET /products ************************************************************ //

const getProduct = async function(req,res) {
    try{
        let size = req.query.size
        let name = req.query.name
        let priceGreaterThan = req.query.priceGreaterThan
        let priceLessThan = req.query.priceLessThan
        let priceSort = req.query.priceSort

        // // Validate query
        // const query = req.query;
        // if(validator.isValidBody(query)) {
        //     return res.status(400).send({ status: false, msg: "Data must be in query"})
        // }

        // Validate of body(It must not be present)
        const body = req.body;
        if(validator.isValidBody(body)) {
            return res.status(400).send({ status: false, msg: "Body must not be present"})
        }

        // Validate params(it must not be present)
        const params = req.params;
        if(validator.isValidBody(params)) {
            return res.status(400).send({status: false, msg: "Invalid request"})
        }

        let data = {}

        // To search size
        if(size) {
            let sizeSearch = await ProductModel.find({availableSizes: size, isDeleted: false}).sort({price: priceSort})

            if(sizeSearch.length !== 0) {
                return res.status(200).send({ status: true, msg: "Success", data: sizeSearch})
            }
            else {
                return res.status(400).send({status: false, msg: "No products exist"})
            }
        }

        // To find products with name
        if(name) {
            let nameSearch = await ProductModel.find({title: {$regex: name}, isDeleted: false}).sort({price:priceSort})

            if(nameSearch.length !== 0) {
                return res.status(200).send({status: true, msg: "Success", data: nameSearch})
            }
            else {
                return res.status(400).send({status: false, msg: "No products exist"})
            }
        }

        // To find the price
        if(priceGreaterThan) {
            data["$gt"] = priceGreaterThan
        }

        if(priceLessThan) {
            data["$lt"] = priceLessThan
        }

        if(priceLessThan || priceGreaterThan) {
            let searchPrice = await ProductModel.find({price:data, isDeleted: false}).sort({price: priceSort})

            if(searchPrice.length !== 0) {
                return res.status(200).send({status: true, msg: "Success", data: searchPrice})
            }
            else {
                return res.status(400).send({status: false, msg: "No products exist"})
            }                
        }
        

    }
    catch (err) {
        console.log("This is the error :", err.message)
        res.status(500).send({ msg: "Error", error: err.message })
    }
}

module.exports.getProduct = getProduct





// ******************************************************** GET /products/:productId ******************************************************* //

const getProductById = async function(req,res) {
    try{

        // Validate of body(It must not be present)
        const body = req.body;
        if(validator.isValidBody(body)) {
            return res.status(400).send({ status: false, msg: "Body must not be present"})
        }

        const productId = req.params.productId
        if(!validator.isValidobjectId(productId)) {
            return res.status(400).send({status: false, msg: `this ${productId} is not valid`})
        }

        const findProductId = await ProductModel.findById({_id: productId})
        if(!findProductId) {
            return res.status(404).send({status: false, msg: `this ${productId} is not exist in database`})
        }

        return res.status(200).send({status: true, data: findProductId})

    }
    catch (err) {
        console.log("This is the error :", err.message)
        res.status(500).send({ msg: "Error", error: err.message })
    }
}

module.exports.getProductById = getProductById





// ******************************************************** GET /products/:productId ******************************************************* //

const updateProduct = async function(req,res) {
    try {

    }
    catch (err) {
        console.log("This is the error :", err.message)
        res.status(500).send({ msg: "Error", error: err.message })
    }
}

module.exports.updateProduct = updateProduct