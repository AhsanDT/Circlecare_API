require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const Message = require("./models/messageModel");
const Chat = require("./models/chatSupportModel");
const {
  uploadImage,
  sendPushNotification,
  sendPushNotificationToSingleDevice,
} = require("./helper/UploadImageFirebase");
const fs = require("fs-extra");
const path = require("path");
const { sendEmail } = require("./helper/functions");
const socketIO = require("socket.io");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const {
  configureFacebookStrategy,
  configureAppleStrategy,
} = require("./controller/socialAuth");
const Notification = require("./models/notificationModel");
const userCtrl = require("./controller/userCtrl");
const { MongoClient } = require("mongodb");
const activeUsers = require("./models/activeUsers");
const Appusers = require("./models/appuserModel");

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));
// app.use(passport.initialize());
// app.use(passport.session());

// // Configure Facebook authentication
// app.post('/auth/facebook/token', configureFacebookStrategy());

// // Configure Apple authentication
// app.get('/auth/apple', configureAppleStrategy());
// app.post('/auth/apple/token', (req, res, next) => configureAppleStrategy()(req, res, next));

// const PORT = 3000;
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });

const app = express();
app.use(bodyParser.json({ limit: "30mb" }));
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: "30mb",
    parameterLimit: 50000,
  })
);
app.use(
  session({
    secret: "bdcf55d35d3d66c8061e5eaccaaed6e1",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json({ limit: "30mb" }));
app.use(
  express.urlencoded({ extended: true, limit: "30mb", parameterLimit: 50000 })
);

// app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(
  fileUpload({
    useTempFiles: true,
  })
);

// Static Path
const staticPath = path.join(__dirname, "uploads/admin/avatar/");
const staticPathAricleMedia = path.join(__dirname, "uploads/admin/article/");
const staticPathDailytaskMedia = path.join(
  __dirname,
  "uploads/admin/dailytask/"
);
const staticPathAppUser = path.join(__dirname, "uploads/appusers/avatar/");

app.use("/useravatar", express.static(staticPath));
app.use("/articles", express.static(staticPathAricleMedia));
app.use("/dailytask", express.static(staticPathDailytaskMedia));
app.use("/appuseravatar", express.static(staticPathAppUser));

//Routes
app.use("/user", require("./routes/userRoutes"));
app.use("/appuser", require("./routes/appuserRoutes"));
app.use("/api", require("./routes/apiRoutes"));
app.use("/chat", require("./routes/chatRoutes"));

app.get("/", (req, res) => {
  res.status(200).json({ msg: "Live!" });
});

// Apple And facebook Routes

// Configure Facebook authentication
app.post("/auth/facebook/token", configureFacebookStrategy());

// Configure Apple authentication
app.get("/auth/apple", configureAppleStrategy());
app.post("/auth/apple/token", (req, res, next) =>
  configureAppleStrategy()(req, res, next)
);

const connection = mongoose
  .connect(process.env.DBURI)
  .then(() => {
    console.log("Mongo DB Connected");
  })
  .catch((err) => {
    console.log("Unable To Connect", err);
  });
// mongoose.connect(process.env.DBURI, { useNewUrlParser: true, useUnifiedTopology: true });

// const connection = mongoose.connection;
// // console.log('Connection',connection);

// connection.on('error', (error) => {
//   console.error('MongoDB connection error:', error);
// });

// connection.once('open', () => {
//   console.log('Connected to MongoDB');
// })

const client = new MongoClient(process.env.DBURI);
client.connect();

const db = client.db("Circle");
// const collection = db.collection('Notification');

const changeStream = db.collection("notifications").watch();

const PORT = process.env.PORT || 5000;
const serverPort = app.listen(PORT, () => {
  console.log("Server is running on port ", PORT);
});
var users = {};
changeStream.on("change", async (change) => {
  // console.log("Document Change:", change);
  const notification = change.fullDocument;
  // Emit a socket event when a document is added
  if (change.operationType === "insert") {
    if (notification.is_all_users === false) {
      const key = notification.app_user_id;
      // socket.to(users[key]).emit("new notification", notification);
      const userFCMToken = await Appusers.findOne(
        { _id: key },
        { FCMToken: 1, _id: 0 }
      );
      if (userFCMToken) {
        const { FCMToken } = userFCMToken;
        console.log(FCMToken);
        sendPushNotificationToSingleDevice(FCMToken, notification);
      }

      // console.log("ddddddd", change.fullDocument.app_user_id);
      // console.log("ddddddd", users[key]);
    } else {
      // socket.emit("new notification", notification);
      var FCMTokens = [];
      const userFCMTokens = await Appusers.find({}, { FCMToken: 1, _id: 0 });
      userFCMTokens.forEach((i) => {
        if (i.FCMToken) {
          FCMTokens = [i.FCMToken, ...FCMTokens];
        }
      });
      console.log(FCMTokens);
      sendPushNotification(FCMTokens, notification);
    }
  }
});

const io = new socketIO.Server(serverPort, {
  pingTimeout: 60000,
  cors: {
    origin: "*",
  },
});
io.on("connection", (socket) => {
  console.log("user Connected");
  var sId = socket.id;
  socket.on("disconnect", () => {
    console.log("user disconnected");

    var id = Object.keys(users).find((key) => users[key] === sId);
    console.log("id/////", id);
    activeUsers.findOneAndUpdate(
      { appUserId: id },
      { $set: { isActive: false } }
    );
  });

  socket.on("online", async (userIds) => {
    console.log("userIds", userIds, socket.id);
    users = {
      [userIds]: socket.id,
      ...users,
    };
    try {
      const user = await activeUsers.findOne({ appUserId: userIds });
      if (!user) {
        activeUsers.create({
          isActive: true,
          appUserId: userIds,
        });
      } else {
        activeUsers.findOneAndUpdate(
          { appUserId: userIds },
          { $set: { isActive: false } },
          { upsert: true }
        );
      }
    } catch (error) {
      console.log(error);
    }

    console.log("users", users);
  });

  changeStream.on("change", async (change) => {
    console.log("Document Change:", change);
    const notification = change.fullDocument;
    // Emit a socket event when a document is added
    if (change.operationType === "insert") {
      if (notification.is_all_users === false) {
        const key = notification.app_user_id;
        socket.to(users[key]).emit("new notification", notification);

        // const FCMToken = await Appusers.findOne(
        //   { _id: key },
        //   { FCMToken: 1, _id: 0 }
        // );
        // console.log(FCMToken);
        // sendPushNotificationToSingleDevice(FCMToken, notification);
        // console.log("ddddddd", change.fullDocument.app_user_id);
        // console.log("ddddddd", users[key]);
      } else {
        socket.emit("new notification", notification);
        // const FCMTokens = await Appusers.find({}, { FCMToken: 1, _id: 0 });
        // console.log(FCMTokens);
        // sendPushNotification(FCMTokens, notification);
      }
    }
  });
  // socket.on("setup", (id, res) => {
  //   try {
  //     socket.join(id);

  //     socket.emit("connected", (res) => {
  //       console.log(res);
  //     });

  //     res(true);
  //     console.log(res);
  //   } catch (error) {
  //     console.log(error);
  //   }

  // });

  socket.on("join room", (room, res) => {
    socket.join(room);
    console.log("room Joined", room);
    res(true);
  });

  // socket.on("typing", (room) => socket.in(room).emit("typing"));
  // socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", async (data, res) => {
    try {
      const { chatId, message, id, file } = data;

      let msg = await Message.create({ sender: id, message, chatId, file });

      // const { chatId, message, id } = data;
      // var image = "";

      // let msg = await Message.create({ sender: id, message, chatId, file: image });

      msg = await msg.populate({
        path: "chatId",
        // select: "chatName customer",
        populate: [
          {
            path: "customer",
            select: "first_name last_name",
          },
          {
            path: "chatSupport",
            select: "first_name last_name",
          },
        ],
      });

      io.to(chatId).emit("message received", msg);
      if (id !== msg.chatId.customer._id) {
        const newNotification = new Notification({
          admin_id: id,
          app_user_id: msg.chatId.customer._id,
          is_all_users: false,
          sender: id,
          content: "New Message Received by Admin",
          route: `chat/${chatId}`,
        });
        const notification = await newNotification.save();

        socket.to(users[id]).emit("new notification", notification);
      }

      // const userFCMToken = await Appusers.findOne(
      //   { _id: id },
      //   { FCMToken: 1, _id: 0 }
      // );

      // const { FCMToken } = userFCMToken;

      // console.log(FCMToken);
      // sendPushNotificationToSingleDevice(FCMToken, newNotification);

      // console.log("hello", chatId);
      await Chat.findByIdAndUpdate(chatId, {
        latestMessage: msg,
      });

      // res.status(200).send(msg);
    } catch (error) {
      console.log(error);
      res(false);
      // res.status(500).json({ error: error });
    }

    // // var chat = newMessageRecieve.chatId;
    // if (!chatId) console.log("chats.users is not defined");
    // // chat.users.forEach((user) => {
    // if (user._id == newMessageRecieve.sender._id) return;
    // socket.in(user._id).emit("message recieved", newMessageRecieve);
    // // });
  });
});
