import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    amount: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      default: "INR"
    },

    paymentGateway: {
      type: String,
      default: "razorpay"
    },

    orderId: {
      type: String,
      required: true
    },

    paymentId: {
      type: String,
      default: null
    },

    status: {
      type: String,
      enum: ["created", "paid", "failed", "refunded"],
      default: "created"
    }
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;