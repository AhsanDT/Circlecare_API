const mongoose = require("mongoose");
const validator = require("validator");
// const { toJSON, paginate } = require('./plugins');

const messageSchema = mongoose.Schema(
  {
    sender: {
      type: String,
      // ref: "Appusers",
    },
    message: {
      type: String,
      trim: true,
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },
    file: {
      type: String,
      trim: true,
    },
    readBy: [
      {
        reader: {
          type: String,
        },
        readAt: { type: Date, default: Date.now },
      },
    ],
    dateTime: {
      type: Date,
      default: new Date(),
    },
  },
  {
    timestamps: true,
  }
);

// messageSchema.plugin(toJSON);
// messageSchema.plugin(paginate);

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
