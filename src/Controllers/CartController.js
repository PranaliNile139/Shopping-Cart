const userModel = require('../Models/UserModel')
const ProductModel = require('../Models/ProductModel')
const cartModel = require('../Models/CartModel')
const validator = require('../Validator/validation')
const CartModel = require('../Models/CartModel')

// ******************************************************** POST /users/:userId/cart ******************************************************* //

const createCart = async function(req,res) {
    try {
        // Validate body
        const body = req.body
        if(!validator.isValidBody(body)) {
            return res.status(400).send({ status: false, msg: "Product details must be present"})
        }

        // Validate query (it must not be present)
        const query = req.query;
        if(validator.isValidBody(query)) {
            return res.status(400).send({ status: false, msg: "Invalid userId"});
        }

        // Validate params
        const userId = req.params.userId;
        if(!validator.isValidobjectId(userId)) {
            return res.status(400).send({ status: false, msg: "Invalid parameters"});
        }

        const userSearch = await userModel.findById({_id: userId})
        if(!userSearch) {
            return res.status(400).send({status: false, msg: "User does not exist"})
        }

        // AUTHORISATION
        if(userId !== req.user.userId) {
            return res.status(401).send({status: false, msg: "Unauthorised access"})
        }


        const{items} = body

        const cartExist = await cartModel.findOne({userId: userId})
        if(!cartExist) {
            // Validate items
            if(!validator.isValid(items)) {
                return res.status(400).send({status: false, msg: "Items is required"})
            }

            // Validate productId
            if(!validator.isValidobjectId(items[0].productId)) {
                return res.status(400).send({status: false, msg: "Invalid ProductId"})
            }

            const product = await ProductModel.findOne({_id:items[0].productId})
            if(!product) {
                return res.status(400).send({status: false, msg: "No product exist"})
            }

            if(product.isDeleted !== false) {
                return res.status(400).send({status: false, msg: "Product is not present."})
            }

            if(!validator.isValid(items[0].quantity)) {
                return res.status(400).send({status: false, msg: "Quantity is required"})
            }

            if(!validator.isvalidNum(items[0].quantity)) {
                return res.status(400).send({status: false, msg: "Invalid quantity number"})
            }

            if(items[0].quantity <= 0) {
                return res.status(400).send({status: false, msg: "Quantity must be in positive number only"})
            }

            // To count total items present
            const totalItems = items.length;

            // To check total price of selected products
            const productPrice = product.price;
            const totalPrice = productPrice*items[0].quantity;

            const cartData = {userId: userId, items, totalItems, totalPrice}
            const created = await CartModel.create(cartData)
            return res.status(201).send({status: true, msg: "Cart created successfully", data: created})
        }


        // To add the products in existing cart
        else{
            const addProduct = await ProductModel.findOne({ _id: items[0].productId})
            if(!addProduct) {
                return res.status(400).send({ status: false, msg: "Product does not exist"})
            }

            if(addProduct.isDeleted !== false) {
                return res.status(400).send({ status: false, msg: "Product is already deleted"})
            }

            // To check total price of selected Products
            const totalPrice = cartExist.totalPrice + (addProduct.price * items[0].quantity)
            for(let i=0; i<cartExist.items.length; i++) {
                if(cartExist.items[i].productId == items[0].productId) {
                    cartExist.items[i].quantity = cartExist.items[i].quantity + items[0].quantity


                    // To increase product quantity and price
                    const cartData = await cartModel.findOneAndUpdate({ userId: userId}, {items: cartExist.items, totalPrice:totalPrice}, {new:true})
                    return res.status(201).send({status: true, msg: "Product successfully added", data: cartData})
                }
            }

            // Count total items in cart
            const totalItems = items.length + cartExist.totalItems;

            const addProducts = await cartModel.findOneAndUpdate({userId: userId}, {$addToSet: {items: {$each: items}}, totalItems:totalItems, totalPrice: totalPrice}, {new:true})
            return res.status(201).send({status: true, data: addProducts})
        }
    }
    catch (err) {
        console.log("This is the error :", err.message)
        res.status(500).send({ msg: "Error", error: err.message })
    }
}

module.exports.createCart = createCart





// ******************************************************** PUT /users/:userId/cart ******************************************************* //

const updateCart = async function(req,res) {
    try{
        // Validate body
        const body = req.body
        if(!validator.isValidBody(body)) {
            return res.status(400).send({ status: false, msg: "Product details must be present"})
        }

        // Validate query (it must not be present)
        const query = req.query;
        if(validator.isValidBody(query)) {
            return res.status(400).send({ status: false, msg: "Invalid userId"});
        }

        // Validate params
        const userId = req.params.userId;
        if(!validator.isValidobjectId(userId)) {
            return res.status(400).send({ status: false, msg: "Invalid parameters"});
        }

        // To check user present or not
        const userSearch = await userModel.findById({_id:userId})
        if(!userSearch) {
            return res.status(400).send({status: false, msg: "userId does not exist"})
        }

        // AUTHORISATION
        if(userId !== req.user.userId) {
            return res.status(401).send({status: false, msg: "Unauthorised access"})
        }

        const {cartId, productId, removeProduct} = body

        // Validate cartId
        if(!validator.isValid(cartId)) {
            return res.status(400).send({status: false, msg: "CartId is required"})
        }

        // Validation of cartId
        if(!validator.isValidobjectId(cartId)) {
            return res.status(400).send({status: false, msg: "Invalid cartId"})
        }

        // Validate productId
        if(!validator.isValid(productId)) {
            return res.status(400).send({status: false, msg: "productId is required"})
        }

        // Validation of productId
        if(!validator.isValidobjectId(productId)) {
            return res.status(400).send({status: false, msg: "Invalid productId"})
        }

        // Validate removeProduct
        if(!validator.isValid(removeProduct)) {
            return res.status(400).send({status: false, msg: "removeProduct is required"})
        }


        //1. Check the cart is present 
        const cartSearch = await cartModel.findOne({_id: cartId})
        if(!cartSearch) {
            return res.status(404).send({status: false, msg: "Cart does not exist"})
        }

        //2. Check the product is present
        const productSearch = await ProductModel.findOne({ _id: productId})
        if(!productSearch) {
            return res.status(404).send({status: false, msg: "product does not exist"})
        }
        // Check product if it is already deleted(isDeleted == true)
        if(productSearch.isDeleted !== false) {
            return res.status(400).send({status: false, msg: "Product is already deleted"})
        }

        // 3. Check remove product

        // Validation of removeProduct
        if(!validator.isValidremoveProduct(removeProduct)) {
            return res.status(400).send({status: false, msg: "Invalid remove product"})
        }

        const cart = cartSearch.items
        for(let i=0; i<cart.length; i++) {
            if(cart[i].productId == productId) {
                const priceChange = cart[i].quantity * productSearch.price
                if(removeProduct == 0) {
                    const productRemove = await cartModel.findOneAndUpdate({_id: cartId}, {$pull: {items:{productId: productId}}, totalPrice: cartSearch.totalPrice-priceChange, totalItems: cartSearch.totalItems - 1}, {new:true})
                    return res.status(200).send({status: true, msg: "Removed product successfully", data: productRemove})
                }

                if(removeProduct == 1) {
                    if(cart[i].quantity == 1 && removeProduct == 1) {
                        const priceUpdate = await cartModel.findOneAndUpdate({_id: cartId}, {$pull: {items: {productId}}, totalPrice:cartSearch.totalPrice-priceChange, totalItems:cartSearch.totalItems - 1}, {new: true})
                        return res.status(200).send({status: true, msg: "Successfully removed product or cart is empty", data: priceUpdate})
                    }

                    cart[i].quantity = cart[i].quantity - 1
                    const updatedCart = await cartModel.findByIdAndUpdate({_id: cartId}, {items: cart, totalPrice:cartSearch.totalPrice -productSearch.price}, {new: true})
                    return res.status(200).send({status: true, msg: "sucessfully decremented the product", data: updatedCart})
                }
            }
        }
        
    }
    catch (err) {
        console.log("This is the error :", err.message)
        res.status(500).send({ msg: "Error", error: err.message })
    }
}

module.exports.updateCart = updateCart






// ******************************************************** GET /users/:userId/cart ******************************************************* //

const getCart = async function(req,res) {
    try{
         // Validate of body(It must not be present)
         const body = req.body;
         if(validator.isValidBody(body)) {
             return res.status(400).send({ status: false, msg: "Body must not be present"})
         }

         // Validate query (it must not be present)
        const query = req.query;
        if(validator.isValidBody(query)) {
            return res.status(400).send({ status: false, msg: "Query must not be present"});
        }

        // Validate params
        userId = req.params.userId
        if(!validator.isValidobjectId(userId)) {
            return res.status(400).send({status: false, msg: `${userId} is invalid`})
        }

        // to check user present or not
        const userSearch = await userModel.findById({_id:userId})
        if(!userSearch) {
            return res.status(400).send({status: false, msg: "userId does not exist"})
        }

        // AUTHORISATION
        if(userId !== req.user.userId) {
            return res.status(401).send({status: false, msg: "Unauthorised access"})
        }

        // To check cart is present or not
        const cartSearch = await cartModel.findOne({userId})
        if(!cartSearch) {
            return res.status(400).send({status: true, msg: "UserId does not exist"})
        }
        return res.status(200).send({status: true, msg: "Success", data: cartSearch})

    }
    catch (err) {
        console.log("This is the error :", err.message)
        res.status(500).send({ msg: "Error", error: err.message })
    }
}

module.exports.getCart = getCart





// ******************************************************** DELETE /users/:userId/cart ******************************************************* //

const deleteCart = async function(req,res) {
    try{
        // Validate body (it must not be present)
        const body = req.body
         if(validator.isValidBody(body)) {
            return res.status(400).send({ status: false, msg: "Invalid parametes"})
        }

        // Validate query (it must not be present)
        const query = req.query;
        if(validator.isValidBody(query)) {
            return res.status(400).send({ status: false, msg: "Invalid parameters"});
        }

         // Validate params
         userId = req.params.userId
         if(!validator.isValidobjectId(userId)) {
            return res.status(400).send({status: false, msg: `${userId} is invalid`})
         }

        //  To check user is present or not
        const userSearch = await userModel.findById({ _id: userId})
        if(!userSearch) {
            return res.status(404).send({status: false, msg: "User doesnot exist"})
        }

        // AUTHORISATION
        if(userId !== req.user.userId) {
            return res.status(401).send({status: false, msg: "Unauthorised access"})
        }

        // To check cart is present or not
        const cartSearch = await cartModel.findOne({userId})
        if(!cartSearch) {
            return res.status(404).send({status:false, msg: "cart doesnot exist"})
        }

        const cartdelete = await cartModel.findOneAndUpdate({userId}, {items:[], totalItems:0, totalPrice:0}, {new: true})
        res.status(200).send({status: true, msg:"Cart deleted"})

    }
    catch (err) {
        console.log("This is the error :", err.message)
        res.status(500).send({ msg: "Error", error: err.message })
    }
}

module.exports.deleteCart = deleteCart



/////////////////////////////////////////////////////////////// END OF CART CONTROLLER ///////////////////////////////////////////////////