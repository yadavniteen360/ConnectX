import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    token:{
        type:String,
        required: true,
        unique: true
    },

    expiresAt:{
        type:Date,
        required: true
    }
},
{
    timestamps:true
}
);


const Refreshtoken = mongoose.model('Refreshtoken',refreshTokenSchema);

export default Refreshtoken;