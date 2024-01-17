const Message = require("../models/messageModel.js");
const Appusers = require("../models/appuserModel");
const Chat = require("../models/chatSupportModel.js");
const Users = require("../models/userModel.js");
const path = require("path");
const fs = require("fs-extra");
const { uploadImage } = require("../helper/UploadImageFirebase");

const createChats = async (req, res) => {
  try {
    const { userId, id, chatName, photo } = req.body;
    // console.log(req.body);
    console.log("id", id, userId);

    if (!userId) res.send({ message: "Provide User's Id" });
    let chatExists = await Chat.findOne({
      isDone: false,
      $and: [
        {
          customer: id,
          chatSupport: userId,
        },
      ],
    })
      .populate("customer")
      .populate("chatSupport")
      .populate("latestMessage");
    console.log("chatExists1", chatExists);
    // chatExists = await Appusers.populate(chatExists, {
    //   path: "latestMessage.sender",
    //   select: "name email profilePic",
    // });
    if (chatExists) {
      res.status(200).send(chatExists);
    } else {
      const data = {
        chatName: chatName,
        photo: photo,
        // users: [userId, id],
        customer: id,
        chatSupport: userId,
        // isGroup: false,
      };
      console.log("data", data);
      try {
        const newChat = await Chat.create(data);
        const chat = await Chat.findOne({ _id: newChat._id })
          .populate("customer", "-password")
          .populate("chatSupport", "-password");
        res.status(200).json(chat);
        // console.log(res);
      } catch (error) {
        res.status(500).send(error);
      }
    }
  } catch (error) {
    res.status(500).send(error);
  }
};

const accessChats = async (req, res) => {
  try {
    const { userId, id, chatName } = req.body;

    // console.log(req.body);
    console.log("id", id, userId);

    if (!userId) res.send({ message: "Provide User's Id" });
    let chatExists = await Chat.findOne({
      isDone: false,
      $and: [
        {
          customer: userId,
          chatSupport: id,
        },
      ],
    })
      .populate("customer")
      .populate("chatSupport")
      .populate("latestMessage");

    console.log("chatExists", chatExists);
    if (chatExists) {
      res.status(200).send(chatExists);
    } else {
      const data = {
        chatName: chatName,
        // users: [userId, id],
        customer: userId,
        chatSupport: id,
        // isGroup: false,
      };
      console.log("data", data);
      try {
        const newChat = await Chat.create(data);
        const chat = await Chat.findOne({ _id: newChat._id })
          .populate("customer", "-password")
          .populate("chatSupport", "-password");
        res.status(200).json(chat);
        // console.log(res);
      } catch (error) {
        res.status(500).send(error);
      }
    }
  } catch (error) {
    res.status(500).send(error);
  }
};

const fetchAllChats = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("id", id);
    const chats = await Chat.find({
      chatSupport: id,
    })
      // .populate("users")
      .populate("latestMessage")
      // .populate("groupAdmin")
      .sort({ updatedAt: -1 });

    // const finalChats = await Users.populate(chats, {
    //   path: "latestMessage.sender",
    //   select: "first_Name last_name email profilePic",
    // });
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).send(error);
    console.log(error);
  }
};

const sendFile = async (req, res) => {
  try {
    const file = req.files.file;
    console.log("file", file);
    if (!file) return res.status(400).json({ error: "File is not uploaded!" });
    const { name, tempFilePath } = file;

    const uploadDirectory = "uploads/appusers/avatar/";
    const extension = path.extname(name);
    const randomFileName = `${Date.now()}${Math.floor(Math.random() * 10000)}${extension}`;
    const destinationPath = `${uploadDirectory}${randomFileName}`;

    await fs.move(tempFilePath, destinationPath);

    // const avatar = process.env.BASE_URL + "appuseravatar/" + randomFileName;
    // console.log(avatar, "./" + destinationPath);

    const firebaseFilePath = "appuseravatar/" + randomFileName;
    uploadImage("./" + destinationPath, firebaseFilePath);
    // console.log("firebaseFilePath", firebaseFilePath);
    const imageUrl = `appuseravatar%2F${randomFileName}?alt=media`;

    res.status(200).json({ success: 1, data: imageUrl });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error });
  }
};

const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    console.log("chatId", chatId);
    let messages = await Message.find({ chatId }).populate({
      path: "chatId",
      model: "Chat",
    });
    res.status(200).json(messages);
  } catch (error) {
    res.sendStatus(500).json({ error: error });
    console.log(error);
  }
};

const getMessagesByUserId = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("chatId", id);
    let messages = await Message.find({ customer: id });
    // .populate({
    //   path: "customer",
    //   model: "Chat",
    // });
    res.status(200).json(messages);
  } catch (error) {
    res.sendStatus(500).json({ error: error });
    console.log(error);
  }
};
// const  getMessages = async (req, res) => {
//   try {
//     const { chatId } = req.params;
//     const messages = await Message.find({ chatId });
//     res.status(200).json(messages);
//     console.log("messages", messages);
//   } catch (error) {
//     res.status(500).json(error);
//   }
// };
// const getChatById = async (req, res) => {
//   try {
//     const { chatId } = req.params;
//     console.log("chatId==>", chatId);

//     const messages = await Message.find({ chatId });
//     // .populate({
//     //   path: "chatId",
//     //   model: "Chat",
//     // });
//     res.status(200).json(messages);
//   } catch (error) {
//     console.log(error);
//     res.sendStatus(500).json({ error: error });
//   }
// };

module.exports = {
  accessChats,
  sendFile,
  getMessages,
  fetchAllChats,
  createChats,
  getMessagesByUserId,
};
