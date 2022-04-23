const userModel = require('../Models/UserModel')
const cartModel = require('../Models/CartModel')
const OrderModel = require('../Models/OrderModel')
const validator = require('../Validator/validation')


// ******************************************************** POST /users/:userId/orders ******************************************************* //

const createOrder = async function(req,res) {
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


        // AUTHORISATION
        if(userId !== req.user.userId) {
            return res.status(401).send({status: false, msg: "Unauthorised access"})
        }

        const {cartId, cancellable, status, deletedAt, isDeleted} = body

        // Validate cartId
        if(!validator.isValid(cartId)) {
            return res.status(400).send({status: false, msg: "cartId must be present"})
        }

        // Validation of cartId
        if(!validator.isValidobjectId(cartId)) {
            return res.status(400).send({status: false, msg: "Invalid cartId"})
        }

        const userSearch = await userModel.findOne({_id: userId})
        if(!userSearch) {
            return res.status(400).send({status: false, msg: "User does not exist"})
        }

        const cartSearch = await cartModel.findOne({userId}).select({items:1, totalPrice:1, totalItems:1})
        if(!cartSearch) {
            return res.status(400).send({status: false, msg: "Cart does not exist"})
        }


        if(status) {
            if(!validator.isValidStatus(status)) {
                return res.status(400).send({status: false, msg: "Order status by default is pending"})
            }
        }
        let order = {
            userId,
            items: cartSearch.items,
            totalPrice: cartSearch.totalPrice,
            totalItems: cartSearch.totalItems,
            totalQuantity: cartSearch.totalItems,
            cancellable,
            status
        }

        let createdOrder = await OrderModel.create(order)
        return res.status(201).send({status: true, msg: "Success", data: createdOrder})
    }
    catch (err) {
        console.log("This is the error :", err.message)
        res.status(500).send({ msg: "Error", error: err.message })
    }
}

module.exports.createOrder = createOrder





// ******************************************************** PUT /users/:userId/orders ******************************************************* //

const updateOrder =async function(req,res) {
    try{
        // Validate body
        const body = req.body
        if(!validator.isValidBody(body)) {
            return res.status(400).send({ status: false, msg: "Order details must be present"})
        }

        // Validate query (it must not be present)
        const query = req.query;
        if(validator.isValidBody(query)) {
            return res.status(400).send({ status: false, msg: "Invalid parameters"});
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

        const {orderId, status} = body
        
        // Validate orderId
        if(!validator.isValid(orderId)) {
            return res.status(400).send({status: false, msg: "orderId is required"})
        }

        // Validation of orderId
        if(!validator.isValidobjectId(orderId)) {
            return res.status(400).send({status: false, msg: "Invalid orderId"})
        }

        const orderSearch = await OrderModel.findOne({_id: orderId})
        if(!orderSearch) {
            return res.status(400).send({status: false, msg: "order does not exist"})
        }

        if(orderSearch.isDeleted == true) {
            return res.status(400).send({status: false, msg: "order is already deleted"})
        }

        const userSearchInOrder = await OrderModel.findOne({userId})
        if(!userSearchInOrder) {
            return res.status(400).send({status: false, msg: "user does not exist"})
        }

        // Validate status
        if(!validator.isValid(status)) {
            return res.status(400).send({status: false, msg: "Order status is required"})
        }

        // Validation of status
        if(!validator.isValidStatus(status)) {
            return res.status(400).send({status: false, msg: "Invalid order status or it is pending"})
        }

        // check if order is cancellable
        if(!(orderSearch.cancellable) == true) {
            return res.status(400).send({status: false, msg: "Order is not cancellable"})
        }

        // check if status is completed or cancelled
        if((orderSearch.status) == "completed") {
            return res.status(400).send({status: false, msg: "Order is already completed, so it can't be updated"})
        }

        if((orderSearch.status) == "cancelled") {
            return res.status(400).send({status: false, msg: "Order is cancelled, so it can't be updated"})
        }


        const orderUpdated = await OrderModel.findOneAndUpdate({_id: orderId}, {status:status}, {new:true})
        return res.status(200).send({status: true, msg: "Order updated successfully", data: orderUpdated})

    }
    catch (err) {
        console.log("This is the error :", err.message)
        res.status(500).send({ msg: "Error", error: err.message })
    }
}

module.exports.updateOrder = updateOrder



/////////////////////////////////////////////////////////////// END OF ORDER CONTROLLER ///////////////////////////////////////////////////