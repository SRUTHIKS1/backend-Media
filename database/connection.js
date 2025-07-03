const mongoose = require('mongoose');
const connectionString = process.env.connectionString
mongoose.connect(connectionString).then(()=>{
    console.log("mongodb Atlas connceted with your server")
}).catch((error)=>{
    console.log(`dabaseconnection failed with:${error}`)

})