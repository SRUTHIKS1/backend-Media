require('dotenv').config()
const express=require('express')
const cors=require('cors')

const app=express()
require('./database/connection')
const PORT=3000;
const router=require('./Routes/route')

app.use(express.json());
app.use(cors())
app.use(router)



app.listen(PORT,(error)=>{
    if(!error)
        console.log("Server is Successfully Running, and App is listening on port "+ PORT)
    else 
        console.log("Error occurred, server can't start", error);
    }
);
