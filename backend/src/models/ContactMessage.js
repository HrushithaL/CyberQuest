const mongoose = require("mongoose");

const contactMessageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ["unread", "read", "replied", "archived"],
        default: "unread"
    },
    repliedAt: {
        type: Date
    },
    replyMessage: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model("ContactMessage", contactMessageSchema);
