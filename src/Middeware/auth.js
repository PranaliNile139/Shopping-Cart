const jwt = require("jsonwebtoken")

const auth = async function(req,res,next) {
    try {
        let header = req.headers['authorization']
        if(!header) {
            return res.status(400).send({status: false, msg: "Authentication token is required"})
        } else{
            let token = header
            let decodedToken = jwt.verify(token,"Group37")
            if(decodedToken) {
                req.user = decodedToken
                next()
            }
        }
    }
    catch (err) {
        console.log("This is the error :", err.message)
        res.status(500).send({ msg: "Error", error: err.message })
    }
}

module.exports.auth = auth





































//             let token = header && header.split(' ')[1]
