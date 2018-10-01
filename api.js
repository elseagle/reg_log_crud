const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const Token = require('./models/Token');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer')
const expressValidator = require('express-validator');


app = express();
app.use(expressValidator()); //checkBody assert
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

mongoose.Promise = global.Promise;

mongoose.connect('mongodb://127.0.0.1/login', {useNewUrlParser: true}, ()=>{
    console.log('connected');
});

app.post('/register', (req, res)=> {
    const newUser = new User();
    newUser.email = req.body.email;
    newUser.fullName = req.body.fullName
    newUser.password = req.body.password;
    newUser.phone = req.body.phone;

    Token.findOne({ email : req.body.email }, function (err, user) {
        if (!user) {

            bcrypt.genSalt(10, (err, salt) => {
                if (err) throw err;
                bcrypt.hash(newUser.password, salt, ( hash) => {
                    // if (err) throw err;
                    newUser.password = hash;
                    newUser.save(err, userSaved => {
                        if(err) throw err;
                        console.log(userSaved);
                        res.send("USER SAVED");
                        let token = new Token({_userId: newUser._id, token: crypto.randomBytes(16).toString('hex')});
            
                        console.log('token created: ' + token.token);
                        token.save(function (err) {
                            if (err) throw err;
                            console.log("I got here");
                            let transporter = nodemailer.createTransport({ 
                                // host: 'gmail.com', 
                                port: 465, 
                                auth: { user: 'seaglenation@gmail.com', pass: 'ogundowole' },
                                secure: true,
                                service: 'gmail'
                            });
                            console.log('email preparing')
                            let mailOptions = {
                                from: 'seaglenation@gmail.com',
                                to: newUser.email,
                                subject: 'Account Verification Token',
                                text: 'Hello,\n\n' + 'Please verify your account by using your email and this token: ' + token.token + " as end points to \n localhost:2001/confirmation"
                            };
                            transporter.sendMail(mailOptions, function (err) {
                                if (err) throw err;
                                console.log('token sent');
                                
                                res.status(200).send('A verification email has been sent to ' + user.email + '.')
                            })
        
                        });
                    })
                })
            })

        }
        else{
            res.send("This user exists")
        }
})
})



app.post('/login', (req, res)=> {
    User.findOne({email: req.body.email}).then(user => {
        if (user) {
            bcrypt.compare(req.body.password, user.password, (err, matched) => {
                if (err) return err;
                else if (!user.isVerified) return res.status(401).send({
                    type: 'not-verified',
                    msg: 'Your account has not been verified.'
                });

                // Login successful, write token, and send back user

                if (matched) {
                    
                    // let session_token = crypto.randomBytes(16).toString('hex');
                    
                    res.send('User Logged in ');


                    //loggedUser.last_login = req.body.last_login;
                    const id = user._id;
                    var query = id;
                    var update = {last_login: Date.now()};
                    var options = {new: true};
                    console.log(user);
                    User.findOneAndUpdate(query, update, options, (err, user) => {
                        console.log(user);
                    });


                }
                else {
                    res.send('Not able to Login')
                }

            })
        }
    })

});


app.post('/confirmation', (req, res, next)=>{
            let email = req.body.email;
            let token = req.body.token;

            // req.checkBody('email', 'Email is not valid').isEmail();
            // req.checkBody('email', 'Email cannot be blank').notEmpty();
            // req.checkBody('token', 'Token cannot be blank').notEmpty();
            // req.sanitize('email').normalizeEmail({ remove_dots: false });

                // Check for validation errors
               

            // Find a matching token
            Token.findOne({ token: token }, function (err, token, user) {
                if (!token) return res.status(400).send({ type: 'not-verified', msg: 'We were unable to find a valid token. Your token my have expired.' });

        // If we found a token, find a matching user
        User.findOne({email: email}, function (err, user) { 
            if (!user) return res.status(400).send({ msg: 'We were unable to find a user for this token.' });
            if (user.isVerified) return res.status(400).send({ type: 'already-verified', msg: 'This user has already been verified.' });

            // Verify and save the user
                user.isVerified = true;
            user.save(function (err) {
                if (err) { return res.status(500).send({ msg: err.message }); }
                res.status(200).send("The account has been verified. Please log in.");
            });
        });
    });
})

port = 2001 || process.env.PORT

app.listen(port, ()=>{
    console.log("SERVER CONNECTED");
})