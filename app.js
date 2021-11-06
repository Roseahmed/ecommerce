require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const flash = require("connect-flash");

const app = express();
const port = 3000;

// config passport-Local_Strategy
require("./config/passport")(passport);

//common middleware
app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.set("view engine", "ejs");
app.use(flash());

const mongoUrl = "mongodb://localhost:27017/ecommerceDB";
//connect db
mongoose.connect(mongoUrl, {
    useNewUrlparser: true,
    useUnifiedTopology: true
}, (err) => {
    if (!err) {
        console.log('Database connected.');
    } else {
        console.log(err);
    }
});

//store session data in database
const sessionStore = MongoStore.create({
    mongoUrl: mongoUrl,
    collectionName: "sessions",
    autoRemove: "native"
});

//create session
app.use(session({
    name: 'test-cookie',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: {
        maxAge: 31536000
    }
}));

//passport middleware
app.use(passport.initialize());
app.use(passport.session());

//////////////////////////////Routes///////////////////////////////////////////
app.use(require("./routes/homeRoute"));
app.use("/user", require("./routes/usersRoutes"));
app.use("/cart", require("./routes/cartRoutes"));
app.use("/checkout", require("./routes/checkoutRoutes"));


// app.post('/order', (req, res) => {
//     const options = {
//         amount: 500 * 100,
//         currency: 'INR',
//         receipt: ''
//     };
//     create a order
//     razorpay.orders.create(options, (err, order) => {
//         if (!err) {
//             console.log(order);
//             orderId = order.id;
//             //console.log(orderId);
//             res.json(order);
//         } else {
//             console.log('Something went wrong.');
//         }
//     });
// });

// app.post('/is-order-complete', (req, res) => {
//     console.log(req.body);
//     hmac.update(orderId + "|" + req.body.razorpay_payment_id);
//     let generatedSignature = hmac.digest('hex');
//     if (generatedSignature === req.body.razorpay_signature) {
//         res.send('Payment successfull.');
//     } else {
//         res.send('Payment not valid.');
//     }
// });

app.listen(port, (err) => {
    if (!err) {
        console.log('Server started at port:', port);
    }
});