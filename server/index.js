import express from 'express';
import connectDB from './db.js';
import authRoutes from './src/routes/authRoutes.js';
// import dotenv from 'dotenv';

// dotenv.config({path:})
const app = express();
app.use(express.json());
connectDB();
// server index testing
app.get('/',(req,res)=>{
    res.send("server is listen")
});

// routes

app.use('/auth', authRoutes);

const PORT = 3020 || process.env.PORT
app.listen(PORT , ()=>{
    console.log(`server is running on http://localhost:${PORT}`)
});


