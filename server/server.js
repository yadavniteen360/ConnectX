import dotenv from 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDb from './config/db_connect.js';
import authRoute from './routes/authRoute.js'


console.log("PORT FROM ENV:", process.env.PORT);

const app = express();

app.use(cors());

connectDb();

const PORT = process.env.PORT || 4001;
app.use(express.json());

app.get('/',(req , res)=>{
    res.send("Hey Niteen How is the day!... ");
});
app.use('/api/auth',authRoute)


app.listen(PORT,()=>{
    console.log(`Server is running on the PORT ${PORT}`);
})