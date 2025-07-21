const mongoose = require('mongoose')

const userSchema = mongoose.Schema({

    userId: {
      type: Number, // Change type to Number for auto-increment
        unique: true,
    },
    Image: {
        type: String // This will hold the URL or path to the image
    },
    name: {
        type: String,
        required: true
    },
    address: {
        type: String

    },
   
    contact: {
        type: String


    },
    location: {
        type: String

    },
    email: {
        type: String,
        required: true,
        unique: true
    },
     

    password: {
        type: String,
        required: true
    },
   
    resetPasswordToken:String,
    resetPasswordExpires:Date,

    
},

   {
  timestamps: true // Adds createdAt and updatedAt
}

)
const users = mongoose.model('users', userSchema)


  module.exports =  users
