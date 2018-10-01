const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const nev = require('email-verification')(mongoose);

app = express();
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

    bcrypt.genSalt(10, (err, salt) => {
        if (err) throw err;
        bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;

            newUser.save().then(userSaved => {
                res.send("USER SAVED" + userSaved);
            }).catch(err => {
                res.send('User not saved because ' + err);
            })

        });
    })
})


app.post('/login', (req, res)=>{
    User.findOne({email: req.body.email}).then(user=>{
        if(user){
            bcrypt.compare(req.body.password, user.password, (err, matched)=>{
                if (err) return err;
                if(matched) {
                    res.send('User Logged in');


                    //loggedUser.last_login = req.body.last_login;
                    const id = user._id ;
                    var query = id;
                    var update = { last_login: Date.now() };
                    var options = {new: true}
                    console.log(user)
                    User.findOneAndUpdate(query, update,options,(err, user) =>{
                        console.log(user);
                    })
                    ;

                }
                else {
                    res.send('Not able to Login')
                }

            })
        }
    })


})




port = 2001 || process.env.PORT

app.listen(port, ()=>{
    console.log("SERVER CONNECTED");
})