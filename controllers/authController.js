const User = require("../models/User");
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer')
// handle errors
const handleErrors = (err) => {
  console.log(err.message, err.code);
  let errors = { email: '', password: '' };

  // incorrect email
  if (err.message === 'incorrect email') {
    errors.email = 'That email is not registered';
  }

  // incorrect password
  if (err.message === 'incorrect password') {
    errors.password = 'That password is incorrect';
  }

  // duplicate email error
  if (err.code === 11000) {
    errors.email = 'that email is already registered';
    return errors;
  }

  // validation errors
  if (err.message.includes('user validation failed')) {
    // console.log(err);
    Object.values(err.errors).forEach(({ properties }) => {
      // console.log(val);
      // console.log(properties);
      errors[properties.path] = properties.message;
    });
  }

  return errors;
}

// create json web token
const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, 'net ninja secret', {
    expiresIn: maxAge
  });
};



// Save user to the database
module.exports.signup_post = async (req, res) => {
  try {
        const user = new User({
        email : req.body.email,
        password : req.body.password,                
        })
        user
        .save()
        .then(result =>{
            if(result){
              const token = createToken(user._id);
              res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
              res.status(201).json({
                message : 'Account created with success'
              });
           }else{
                  res.status(201).json({
                    message : 'Account does not be saved to the database'
                  });
            }
        })
        .catch(err =>{
                res.status(201).json({
                  message : 'Email already registred'
                });
              })
      }
      catch(err) {
        const errors = handleErrors(err);
        res.status(400).json({ errors });
      }
  
}

module.exports.login_post = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.login(email, password);
    const token = createToken(user._id);
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(200).json({
      message : user
    });
  } 
  catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }

}

module.exports.logout_get = (req, res) => {
  res.cookie('jwt', '', { maxAge: 1 });
  res.status(200).json({message : 'You are logged out'});
}
const generateCode = ()=>{
  let code = Math.floor(Math.random() * 100000);
  return code.toString() ; 
}

function sendMail(user){
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'amir.maalaoui27@gmail.com',
        pass: 'xbrwuldvynvidhdy'
      }
    });

    var mailOptions = {
      from: 'amir.maalaoui27@gmail.com',
      to: user,
      subject: 'Sending Email using Node.js',
      text: codeV
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
} 

var codeV = generateCode();
const store = require("store2");

module.exports.send_email = (req, res) => {  
  User.findOne({email : req.body.email })
  .then(user =>{
    if(user){
      const use = req.body.email
      sendMail(use);
      store('Code', {code:codeV,email:req.body.email}); 
      res.status(500).json({
        message : 'Verification code is sent to your email'
      })
    }else{
      res.status(500).json({
        message : 'User not found'
      })
    }
  }).catch(err=>{
    console.log(err)
  })
}

module.exports.verify_code = (req, res) => {   
  const code  = (store.getAll().Code.code)
  if((req.body.code)== code){  
    res.status(200).json({
      message : 'The same code now you can change your password'
    })
  }else{
    res.status(500).json({
      message : 'Verify your verification code '
    })
  }
}
const bcrypt = require('bcrypt');
module.exports.change_pass = async (req, res) => {   
  // User.findOne({email : req.body.email })
  const newpass = req.body.newpass ; 
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(newpass,salt);
  User.findOne({email:(store.getAll().Code.email)})
  .then(user =>{
    if(user){
      User.findOneAndUpdate({email:(store.getAll().Code.email)},{$set:{
        password : hashedPassword
      }})
      .then(pass =>{
        if(pass){
          res.status(200).json({
            message : 'password updated with success'
          })
        }else{
          res.status(500).json({
            message : 'password not updated'
          })
        }
      })
    }else{
      res.status(500).json({
        message : 'User not found'
      })
    }
  }).catch(err=>{
    res.status(200).json({
      message : err
    })
  })
}

module.exports.testKey = (req, res) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, 'net ninja secret', async (err, decodedToken) => {
      if (err) {
        res.locals.user = null;
        res.status(500).json({
          message : "You are not the specified user"
        })
      } else {
        let user = await User.findById(decodedToken.id);
        res.status(200).json({
          message : {
            id : user._id,
            email : user.email
          }
        })
      }
    })
  }else{
    res.status(500).json({
      message : "You are not authenticated"
    })
  }


}


