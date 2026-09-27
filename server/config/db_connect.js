import mongoose, { connect } from "mongoose";


const connectDb = async ()=>{
   try {
    const mongo_url = process.env.MONGODB_URL;

    if(!mongo_url){
        throw new Error("Mongo url not found..");
    }

    await mongoose.connect(mongo_url);
        console.log("MongoDB connedted sussessfully..... ");
   } catch (error) {
    console.log('Erron occur in connecting Database..', error)
   }
}

export default connectDb;