const LocalStrategy = require("passport-local").Strategy
const customerModel = require("../models/customerModel");
const bcrypt = require("bcrypt");

module.exports = (passport) => {
    passport.use(new LocalStrategy({
            usernameField: "userName",
            passwordField: 'userPassword'
        },
        function(username, password, done) {
            customerModel.findOne({ name: username }, function(err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    console.log("User name not found!!!");
                    return done(null, false, { message: "User name not found !!!" });
                }
                const comparePassword = bcrypt.compareSync(password, user.password);
                if (!comparePassword) {
                    console.log("Incorrect password!!!");
                    return done(null, false, { message: "Incorrect password !!!" });
                }
                console.log("Authenticated successfull and name of user is: ", user.name);
                return done(null, user);
            });
        }
    ));

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        customerModel.findById(id, function(err, user) {
            done(err, user);
        });
    });
}