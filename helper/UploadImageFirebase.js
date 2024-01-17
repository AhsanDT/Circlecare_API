const admin = require("firebase-admin");
const serviceAccount = require("../circlecare-a52c7-firebase-adminsdk-fli4f-d8a313a38f.json");
const fs = require("fs");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "circlecare-a52c7.appspot.com",
});

const bucket = admin.storage().bucket();

async function uploadImage(fileData, remoteFileName) {
  try {
    const fileBuffer = fs.readFileSync(fileData);
    await bucket.file(remoteFileName).save(fileBuffer);
    console.log("Image uploaded successfully!");
  } catch (error) {
    console.error("Error uploading image:", error.message);
  }
}

async function getDownloadURL(filePath) {
  try {
    const bucket = admin.storage().bucket();

    // Specify the path to the file you want to get the download URL for
    const file = bucket.file(filePath);

    // Get the download URL
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: "01-01-3000", // Set an expiration date if needed
    });

    return url;
  } catch (error) {
    console.error("Error getting download URL:", error);
    throw error;
  }
}
// This registration token comes from the client FCM SDKs.
// const registrationToken = 'YOUR_REGISTRATION_TOKEN';

// const message = {
//   data: {
//     score: '850',
//     time: '2:45'
//   },
//   token: registrationToken
// };

// // Send a message to the device corresponding to the provided
// // registration token.
// getMessaging().send(message)
//   .then((response) => {
//     // Response is a message ID string.
//     console.log('Successfully sent message:', response);
//   })
//   .catch((error) => {
//     console.log('Error sending message:', error);
//   });

// const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// admin.initializeApp({
//   credential: admin.credential.cert({
//     projectId: 'YOUR_PROJECT_ID',
//     clientEmail: 'YOUR_CLIENT_EMAIL',
//     privateKey: 'YOUR_PRIVATE_KEY',
//   }),
// });

// Function to send a push notification to specific FCM tokens
const sendPushNotification = (tokens, payload) => {
  const message = {
    tokens: tokens,
    notification: {
      // title: payload.title,
      title: "Circle Care Notification",
      body: payload.content,
    },
  };
  admin
    .messaging()
    .sendMulticast(message)
    .then((response) => {
      console.log("Successfully sent push notification:", response);
    })
    .catch((error) => {
      console.error("Error sending push notification:", error);
    });
};

// Usage: Example FCM tokens from client devices
// const fcmTokens = ["DEVICE_FCM_TOKEN_1", "DEVICE_FCM_TOKEN_2" /* ... */];
// const notificationPayload = {
//   title: "New Update",
//   body: "You have a new message!",
// };

// sendPushNotification(fcmTokens, notificationPayload);

// Function to send a push notification to a single FCM token
const sendPushNotificationToSingleDevice = (token, payload) => {
  const message = {
    token: token,
    notification: {
      // title: payload.title,
      title: "Circle Care Notification",

      body: payload.content,
    },
  };

  admin
    .messaging()
    .send(message)
    .then((response) => {
      console.log("Successfully sent push notification:", response);
    })
    .catch((error) => {
      console.error("Error sending push notification:", error);
    });
};

// Usage: Example FCM token from a specific device
// const deviceFCMToken = "SPECIFIC_DEVICE_FCM_TOKEN";

// sendPushNotificationToSingleDevice(deviceFCMToken, notificationPayload);

module.exports = {
  uploadImage,
  getDownloadURL,
  sendPushNotification,
  sendPushNotificationToSingleDevice,
};
