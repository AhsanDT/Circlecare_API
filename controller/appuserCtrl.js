const Appusers = require("../models/appuserModel");
const Questionnaires = require("../models/questionModel");
const FilledSurveys = require("../models/filledsurverysModel");
const DailyReflections = require("../models/dailyreflectionModel");
const DailyTasks = require("../models/dailytaskModel");
const Dailytaskassigns = require("../models/dailytaskassignModel");
const Articles = require("../models/articleModel");
const Myrecords = require("../models/myrecordsModel");
const Pain_assessments = require("../models/painassessmentModel");
const QuestionnairesScore = require("../models/questions_Score");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const fs = require("fs-extra");
const path = require("path");
const nodemailer = require("nodemailer");
const { uploadImage } = require("../helper/UploadImageFirebase");
const { getDownloadURL } = require("../helper/UploadImageFirebase");
const { OAuth2Client } = require("google-auth-library");
const mongoose = require("mongoose");
const Notification = require("../models/notificationModel");

const {
  validateEmail,
  generateOTP,
  addMinutesToTime,
  validatePassword,
  validateOTP,
  validateDate,
  validateDateOfBirth,
  existingLastPasswords,
  getAge,
  sendEmail,
} = require("../helper/functions");

const sgMail = require("@sendgrid/mail");
const activeUsers = require("../models/activeUsers");
const Chat = require("../models/chatSupportModel");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// DEFINES
const otp_expire_minutes = 10;
const refresh_token_expire_minutes = 10080;

const appuserCtrl = {
  // googleAuth: async (req, res) => {
  //   try {
  //     const { tokenId } = req.body;
  //     console.log(tokenId, "tokenId");
  //     const client = new OAuth2Client(process.env.CLIENT_ID);
  //     const verify = await client.verifyIdToken({
  //       idToken: tokenId,
  //       audience: process.env.CLIENT_ID,
  //     });
  //     console.log("verify", verify);
  //     const { email_verified, email, name, picture } = verify.payload;
  //     console.log("verify.payload", verify.payload);
  //     if (!email_verified) res.json({ message: "Email Not Verified" });
  //     const userExist = await Appusers.findOne({ email }).select("-password");
  //     console.log("userExist", userExist);
  //     if (userExist) {
  //       // res.cookie("userToken", tokenId, {
  //       //   httpOnly: true,
  //       //   maxAge: 24 * 60 * 60 * 1000,
  //       // });
  //       // res.status(200).json({ token: tokenId, user: userExist });
  //       res.status(200).json({
  //         error:
  //           "Email already exist in Circles Care, Kindly login with your Circles Care credentials ",
  //       });
  //     } else {
  //       const password = email + process.env.CLIENT_ID;
  //       const newUser = await Appusers({
  //         // name: name,
  //         first_name: name,
  //         profilePic: picture,
  //         password,
  //         email,
  //       });
  //       await newUser.save();
  //       res.cookie("userToken", tokenId, {
  //         httpOnly: true,
  //         maxAge: 24 * 60 * 60 * 1000,
  //       });
  //       res.status(200).json({ message: "User registered Successfully", token: tokenId });
  //     }
  //   } catch (error) {
  //     res.status(500).json({ error: error });
  //     console.log("error in googleAuth backend" + error);
  //   }
  // },
  googleAuth: async (req, res) => {
    try {
      const {
        FCMToken,
        first_name,
        last_name,
        nickname,
        gender,
        dob,
        marital_status,
        email,
        user_type,
        linguistic_prefrences,
        education_level,
        cancer_type,
        tumor_stage,
        current_cancer_treatment,
        other_conditions,
        severity_of_symptoms,
        regular_checkup_reminders,
        regular_doctors_appointments,
        signature,
        privacy_policy,
        send_agreement_to_email,
        year_of_diagnose,
        appleId,
        googleId,
      } = req.body;

      // const url = `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`;
      // const tokenInfoResponse = await fetch(url);
      // const tokenInfo = await tokenInfoResponse.json();

      // if (!tokenInfo || tokenInfo.error) {
      //   res.status(400).json({ message: "Invalid access token or token expired" });
      //   return;
      // }

      // const { email_verified } = tokenInfo;

      // if (!email_verified) {
      //   res.status(400).json({ message: "Email not verified or unavailable" });
      //   return;
      // }

      const existingUser = await Appusers.findOne({ email });

      if (existingUser) {
        const password = email + process.env.CLIENT_ID;

        if (password === existingUser.password) {
          // Update FCM token for the existing user
          await Appusers.findOneAndUpdate(
            { email: email.toLowerCase() },
            { $set: { FCMToken, googleAuth: false } }
          );

          // Fetch aggregated scores for the user from another model (FilledSurveys)
          const aggregatedScores = await FilledSurveys.find({
            app_user_id: existingUser.id,
          });
          const totalSurveyScore = aggregatedScores.reduce(
            (accumulator, currentValue) => {
              return accumulator + (currentValue.survey_score || 0);
            },
            0
          );

          const {
            id,
            first_name,
            last_name,
            nickname,
            gender,
            dob,
            avatar,
            googleAuth,
          } = existingUser;
          const access_token = createAccessToken({ id: existingUser.id });

          res.status(200).json({
            success: 1,
            msg: "Login Success!",
            access_token,
            user: {
              id,
              first_name,
              last_name,
              nickname,
              gender,
              dob,
              email: email.toLowerCase(),
              avatar,
              score: totalSurveyScore,
              googleAuth,
            },
          });
        } else {
          res.status(400).json({
            error:
              "Email already exists in Circles Care. Please login with your Circles Care credentials.",
          });
        }
      } else {
        // const {  first_name, last_name, image} = req.body;
        const password = email + process.env.CLIENT_ID;

        const newUser = new Appusers({
          first_name,
          last_name,
          nickname,
          gender,
          dob,
          marital_status,
          email,
          password,
          user_type,
          linguistic_prefrences,
          education_level,
          cancer_type,
          tumor_stage,
          current_cancer_treatment,
          other_conditions,
          severity_of_symptoms,
          regular_checkup_reminders,
          regular_doctors_appointments,
          signature,
          privacy_policy,
          send_agreement_to_email,
          year_of_diagnose,
          FCMToken,
          googleAuth: true,
        });
        const user = await newUser.save();

        const { id, googleAuth } = user;
        const access_token = createAccessToken({ id: user.id });

        res.status(200).json({
          message: "User registered successfully",
          token: access_token,
          user: {
            id,
            first_name,
            last_name,
            nickname,
            gender,
            dob,
            marital_status,
            email,
            password,
            user_type,
            linguistic_prefrences,
            education_level,
            cancer_type,
            tumor_stage,
            current_cancer_treatment,
            other_conditions,
            severity_of_symptoms,
            regular_checkup_reminders,
            regular_doctors_appointments,
            signature,
            privacy_policy,
            send_agreement_to_email,
            year_of_diagnose,
            FCMToken,
            score: 1,
            googleAuth,
          },
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
      console.log("Error in Google authentication backend: " + error);
    }
  },

  register: async (req, res) => {
    try {
      const {
        first_name,
        last_name,
        nickname,
        gender,
        dob,
        marital_status,
        email,
        password,
        user_type,
        linguistic_prefrences,
        education_level,
        cancer_type,
        tumor_stage,
        current_cancer_treatment,
        other_conditions,
        severity_of_symptoms,
        regular_checkup_reminders,
        regular_doctors_appointments,
        signature,
        privacy_policy,
        send_agreement_to_email,
        year_of_diagnose,
        FCMToken,
      } = req.body;

      if (
        !first_name ||
        !last_name ||
        !gender ||
        !dob ||
        !marital_status ||
        !email ||
        !password ||
        !user_type ||
        !linguistic_prefrences ||
        !education_level ||
        !cancer_type ||
        !signature ||
        !privacy_policy ||
        !send_agreement_to_email
      )
        return res.status(400).json({ error: "All feilds are required." });

      // Define a function to check if a field is empty
      const isFieldEmpty = (field) => field === undefined || field === null;

      if (cancer_type != "None") {
        if (
          !tumor_stage ||
          !current_cancer_treatment ||
          !other_conditions ||
          !severity_of_symptoms ||
          !regular_checkup_reminders ||
          !regular_doctors_appointments
        ) {
          return res.status(400).json({ error: "All feilds are required." });
        }
      }

      if (!validateEmail(email.toLowerCase()))
        return res.status(400).json({ error: "Invalid email." });

      const check = await Appusers.findOne({ email });
      if (check) return res.status(400).json({ error: "Email already exist." });

      if (!validatePassword(password))
        return res.status(400).json({
          error:
            "Password must be atleast 6 Characters long, contains capital Letter and special character.",
        });

      // if (!validateDate(dob))
      //   return res.status(400).json({ error: "Format Error, Expected DD-MM-YYYY." });

      // if (!validateDateOfBirth(dob))
      //   return res.status(400).json({ error: "You are too young or old to use such app." });
      const googleAuth = false;
      const otp = generateOTP();
      const currentdate = new Date();
      const otp_expires = addMinutesToTime(currentdate, otp_expire_minutes); // 1 => Minute

      const passwordHash = await bcrypt.hash(password, 12);
      const newUser = {
        first_name,
        last_name,
        nickname,
        gender,
        dob,
        marital_status,
        email: email.toLowerCase(),
        password: passwordHash,
        user_type,
        linguistic_prefrences,
        education_level,
        cancer_type,
        tumor_stage: isFieldEmpty(tumor_stage) ? "None" : tumor_stage,
        current_cancer_treatment: isFieldEmpty(current_cancer_treatment)
          ? "None"
          : current_cancer_treatment,
        other_conditions: isFieldEmpty(other_conditions)
          ? "None"
          : other_conditions,
        severity_of_symptoms: isFieldEmpty(severity_of_symptoms)
          ? "None"
          : severity_of_symptoms,
        regular_checkup_reminders: isFieldEmpty(regular_checkup_reminders)
          ? "None"
          : regular_checkup_reminders,
        regular_doctors_appointments: isFieldEmpty(regular_doctors_appointments)
          ? "None"
          : regular_doctors_appointments,
        signature,
        privacy_policy,
        send_agreement_to_email,
        year_of_diagnose,
        otp,
        otp_expires,
        FCMToken,
        googleAuth: googleAuth,
      };

      const activation_token = createActivationToken(newUser);

      //SEND MAIL
      const msg = {
        to: email.toLowerCase(),
        // from: 'noreply@ntamgroup.com', // Use the email address or domain you verified above
        from: "noreply@saptech.com.pk", // Use the email address or domain you verified above
        subject: "Your Circlecare OTP",
        // html:"<h4 style='color: #000'>Hi " + first_name + " " + last_name + "<br/><br/>Welcome to Circlecare Mental Health Application! We are so glad to have you on board.<br/><br/>Here are the <a href='https://circle-care-web-app.vercel.app/'>Terms and Conditions</a>. Please read them carefully before registration.<br/><br/>To complete your sign-up, please use the following OTP code: <h2>"+otp+"</h2><br/><br/><b>Please note that This code expires shortly.</b><br/><br/>Thank you for placing your trust in CircleCare. We are excited to be a part of your journey to wellness!<br/><br/>Welcome Onboard<br/><br/>Circlecare team</h4>",
        html:
          "<p>Hi " +
          first_name +
          " " +
          last_name +
          ",</p><p>Welcome to Circlecare Mental Health Application! We are so glad to have you on board.</p><p>Here are the <a href='https://circle-care-web-app.vercel.app/' style='color: black;'>Terms and Conditions</a>. Please read them carefully before registration.</p><p>To complete your sign-up, please use the following OTP code: <h2>" +
          otp +
          "</h2></p><p><b>Please note that This code expires shortly.</b></p><p>Thank you for placing your trust in CircleCare. We are excited to be a part of your journey to wellness!</p><h1>Welcome Onboard</h1><p>Circlecare team</p>",

        // text: "Hi" + first_name + last_name,
        // text:"Welcome to Circlecare Mental Health Application! We are so glad to have you on board.",
        // text:"Here are the Terms and Conditions (Hyperlinked), Please read them carefully before registration",
        // text:"To complete your sign-up, please use the following OTP code:",
        // html: "<h1>" + otp + "</h1>",
      };

      // Welcome to Circlecare Mental Health Application! We are so glad to have you on board.
      // Here are the Terms and Conditions (Hyperlinked), Please read them carefully before
      // registration.
      // To complete your sign-up, please use the following OTP code:
      // [OTP Code]
      // Please note that This code expires shortly.
      // Thank you for placing your trust in CircleCare. We are excited to be a part of your journey to
      // wellness!
      // Welcome Onboard,
      // Circlecare team

      try {
        // await sgMail.send(msg);
        await sendEmail(msg);
      } catch (error) {
        console.error(error);
      }

      res.status(200).json({
        success: 1,
        msg: "OTP sent to your email please verify, expires in 10 minutes.",
        activation_token,
        otp_expires,
      });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  regenerate_otp: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email)
        return res.status(400).json({ error: "All feilds are required." });

      if (!validateEmail(email))
        return res.status(400).json({ error: "Invalid email." });

      const check = await Appusers.findOne({ email });
      if (!check)
        return res.status(400).json({ error: "Email does not exist." });

      if (check?.otp_verified)
        return res.status(400).json({ error: "Email already verified." });

      const otp = generateOTP();
      const currentdate = new Date();
      const otp_expires = addMinutesToTime(currentdate, otp_expire_minutes); // 1 => Minute

      await Appusers.findOneAndUpdate({ _id: check._id }, { otp, otp_expires });

      //SEND MAIL
      const msg = {
        to: email.toLowerCase(),
        // from: 'noreply@ntamgroup.com', // Use the email address or domain you verified above
        from: "noreply@saptech.com.pk", // Use the email address or domain you verified above
        subject: "Secure OTP Notification",
        text: "Secure OTP Notification",
        html: "Yout OTP Code is <h1>" + otp + "</h1>",

        //         Subject: Your Circlecare OTP
        // Hi [Username],
        // Welcome to Circlecare Mental Health Application! We are so glad to have you on board.
        // Here are the Terms and Conditions (Hyperlinked), Please read them carefully before
        // registration.
        // To complete your sign-up, please use the following OTP code:
        // [OTP Code]
        // Please note that This code expires shortly.
        // Thank you for placing your trust in CircleCare. We are excited to be a part of your journey to
        // wellness!
        // Welcome Onboard,
        // Circlecare team
      };

      try {
        // await sgMail.send(msg);
        await sendEmail(msg);

        console.log("SENT");
      } catch (error) {
        console.error(error);
      }

      res.status(200).json({
        success: 1,
        msg: "OTP sent to your email please verify. OTP expires in 10 minutes.",
      });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  activateEmail: async (req, res) => {
    try {
      const { activation_token, otp_number } = req.body;

      if (!activation_token || !otp_number)
        return res.status(400).json({ error: "All feilds are required." });

      const user = jwt.verify(
        activation_token,
        process.env.ACTIVATION_TOKEN_SECRET_APPUSERS
      );

      const {
        first_name,
        last_name,
        gender,
        dob,
        marital_status,
        email,
        password,
        user_type,
        linguistic_prefrences,
        education_level,
        cancer_type,
        tumor_stage,
        current_cancer_treatment,
        other_conditions,
        severity_of_symptoms,
        regular_checkup_reminders,
        signature,
        privacy_policy,
        send_agreement_to_email,
        regular_doctors_appointments,
        year_of_diagnose,
        otp,
        otp_expires,
        googleAuth,
        FCMToken,
      } = user;

      if (!otp || !otp_expires)
        return res.status(400).json({ error: "All feilds are required." });

      const currentdate = new Date();
      const otp_expires_current = new Date(otp_expires);

      if (currentdate > otp_expires_current)
        return res.status(410).json({ error: "OTP expired." });

      if (otp_number != otp)
        return res.status(400).json({ error: "Invalid Otp." });

      const check = await Appusers.findOne({ email });
      if (check) return res.status(400).json({ error: "Email already exist." });

      const newUser = new Appusers({
        first_name,
        last_name,
        email: email.toLowerCase(),
        gender,
        dob,
        marital_status,
        password,
        last_passwords: [password],
        user_type,
        linguistic_prefrences,
        education_level,
        cancer_type,
        tumor_stage,
        current_cancer_treatment,
        other_conditions,
        severity_of_symptoms,
        regular_doctors_appointments,
        regular_checkup_reminders,
        signature,
        privacy_policy,
        send_agreement_to_email,
        year_of_diagnose,
        avatar:
          "https://www.kindpng.com/picc/m/24-248729_stockvader-predicted-adig-user-profile-image-png-transparent.png",
        googleAuth: false,
        FCMToken,
      });

      const saveduser = await newUser.save();
      const access_token = createAccessToken({ id: saveduser.id });

      res.status(200).json({
        success: 1,
        msg: "Account has been activated.",
        access_token,
        user: { ...saveduser._doc, score: 1 },
      });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  },
  login: async (req, res) => {
    try {
      const { email, password, FCMToken } = req.body;

      if (!email || !password)
        return res.status(400).json({ error: "All feilds are required" });

      if (!validateEmail(email))
        return res.status(400).json({ error: "Invalid email." });

      if (!validatePassword(password))
        return res.status(400).json({
          error:
            "Password must be atleast 6 Characters long, contains capital Letter and special character.",
        });

      const user = await Appusers.findOne({ email: email.toLowerCase() });
      if (!user)
        return res.status(400).json({ error: "This email does not exist." });

      if (!user.status)
        return res.status(401).json({
          error: "User deactivated, Please contact with administrator!",
        });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ error: "Incorrect Password." });

      // if (!user.otp_verified)
      //     return res.status(400).json({ error: "Unverified Account." })

      if (!user.status)
        return res
          .status(400)
          .json({ error: "Account Is Blocked. Please contact administrator" });

      // REFRESH TOKEN ISSUE
      // const refresh_token = createRefreshToken({ id: user.id })
      await Appusers.findOneAndUpdate(
        { email: email.toLowerCase() },
        {
          $set: {
            FCMToken: FCMToken,
            googleAuth: false,
          },
        }
      );
      const access_token = createAccessToken({ id: user.id });

      const { id, first_name, last_name, nickname, gender, dob, avatar } = user;
      const aggregatedScores = await FilledSurveys.find({
        app_user_id: user.id,
      });
      const googleAuth = false;

      // console.log("aggregatedScores", aggregatedScores);
      const totalSurveyScore = aggregatedScores.reduce(
        (accumulator, currentValue) => {
          return accumulator + (currentValue.survey_score || 0); // Ensure to handle undefined or null values
        },
        1
      );
      // res.status(200).json({ success: 1, msg: "Login Success!", refresh_token: refresh_token, expires: addMinutesToTime(new Date(), refresh_token_expire_minutes) })
      res.status(200).json({
        success: 1,
        msg: "Login Success!",
        access_token,
        user: {
          id,
          first_name,
          last_name,
          nickname,
          gender,
          dob,
          email: email.toLowerCase(),
          avatar,
          score: totalSurveyScore,
          googleAuth: googleAuth,
        },
      });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  getAccessToken: async (req, res) => {
    try {
      const { rf_token } = req.body;

      if (!rf_token) return res.status(400).json({ error: "Please Login!" });

      jwt.verify(
        rf_token,
        process.env.REFRESH_TOKEN_SECRET_APPUSERS,
        (err, user) => {
          if (err) return res.status(400).json({ error: "Please Login!" });

          const access_token = createAccessToken({ id: user.id });

          return res.json({ access_token: "Bearer " + access_token });
        }
      );
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email)
        return res.status(400).json({ error: "All feilds are required" });

      if (!validateEmail(email))
        return res.status(400).json({ error: "Invalid email." });

      const user = await Appusers.findOne({ email: email.toLowerCase() });
      if (!user)
        return res.status(400).json({ error: "This email does not exist." });

      const otp = generateOTP();
      const currentdate = new Date();
      const expires = addMinutesToTime(new Date(), otp_expire_minutes);
      const otp_expires = {
        created_at: currentdate.toISOString(),
        expires: expires,
        otp,
      };

      await Appusers.findOneAndUpdate(
        { _id: user._id },
        { $push: { forgot_password: otp_expires } }
      );

      //SEND MAIL
      const msg = {
        to: email.toLowerCase(),
        from: "noreply@saptech.com.pk", // Use the email address or domain you verified above
        // from: 'no-reply@asanrealestate.co', // Use the email address or domain you verified above
        subject: "Secure OTP Notification",
        text: "Secure OTP Notification",
        html:
          "<p>Dear " +
          user.first_name +
          " " +
          user.last_name +
          ",</p><p>Please use the following One-Time Password (OTP) to verify your email and proceed with the password reset:</p><p> <h2>" +
          otp +
          "</h2> </p><p>If you did not request this password reset, kindly ignore this email. Your account security is our priority.</p><p>Thank you for choosing Circlecare,</p><p>Circlecare team</p>",
      };

      try {
        // await sgMail.send(msg);
        await sendEmail(msg);

        console.log("SENT");
      } catch (error) {
        console.error(error);
      }

      res.status(200).json({
        success: 1,
        msg: "OTP sent to your email please verify. OTP expires in 10 minutes.",
      });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  // forgotPassword: async (req, res) => {
  //     try {
  //         const { email } = req.body;

  //         if (!email)
  //             return res.status(400).json({ error: "All fields are required" });

  //         if (!validateEmail(email))
  //             return res.status(400).json({ error: "Invalid email." });

  //         const user = await Appusers.findOne({ "email": email });
  //         if (!user)
  //             return res.status(400).json({ error: "This email does not exist." });

  //         const otp = generateOTP();
  //         const currentdate = new Date();
  //         const expires = addMinutesToTime(new Date(), otp_expire_minutes);
  //         const otp_expires = { created_at: currentdate.toISOString(), expires: expires, otp };

  //         await Appusers.findOneAndUpdate({ _id: user._id }, { $push: { forgot_password: otp_expires } });

  //         // Set up Nodemailer transporter
  //         const transporter = nodemailer.createTransport({
  //             host: 'mail.saptech.com.pk', // e.g., 'smtp.example.com'
  //             port: 465, // SMTP port
  //             secure: true, // true for 465, false for other ports
  //             auth: {
  //                 user: 'noreply@saptech.com.pk',
  //                 pass: '!76mhe5,kbJQ'
  //             }
  //         });

  //         // Email content
  //         const mailOptions = {
  //             from: 'noreply@liveasoft.com',
  //             to: email,
  //             subject: 'Secure OTP Notification',
  //             text: 'Secure OTP Notification',
  //             html: `Your OTP Code is <h1>${otp}</h1>`,
  //         };

  //         // Send email
  //         transporter.sendMail(mailOptions, (error, info) => {
  //             if (error) {
  //                 console.error(error);
  //                 return res.status(500).json({ error: "Error sending email." });
  //             }
  //             console.log("Email sent: " + info.response);
  //             res.status(200).json({ success: 1, msg: "OTP sent to your email. OTP expires in 10 minutes." });
  //         });

  //     } catch (err) {
  //         res.status(500).json({ msg: err.message });
  //     }
  // },
  verifyforgotOTP: async (req, res) => {
    try {
      const { otp, email } = req.body;

      if (!email || !otp)
        return res.status(400).json({ error: "All feilds are required" });

      if (!validateEmail(email))
        return res.status(400).json({ error: "Invalid email." });

      const user = await Appusers.findOne({ email: email });
      if (!user)
        return res.status(400).json({ error: "This email does not exist." });

      if (!validateOTP(otp))
        return res.status(400).json({ error: "Invalid otp." });

      if (!user.forgot_password[0].otp)
        return res
          .status(400)
          .json({ error: "Please generate Reset OTP First." });

      const check = user.forgot_password.at(-1);
      if (check.otp != otp)
        return res.status(400).json({ error: "Invalid Otp." });

      const currentdate = new Date();
      const otp_expires = new Date(check?.expires);

      if (currentdate > otp_expires)
        return res.status(410).json({ error: "OTP expired." });

      res.status(200).json({ success: 1, msg: "Verified." });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  resetPassword: async (req, res) => {
    try {
      const { email, otp, password } = req.body;

      if (!email || !otp || !password)
        return res.status(400).json({ error: "All feilds are required" });

      if (!validateEmail(email))
        return res.status(400).json({ error: "Invalid email." });

      const user = await Appusers.findOne({ email: email.toLowerCase() });
      if (!user)
        return res.status(400).json({ error: "This email does not exist." });

      if (!validateOTP(otp))
        return res.status(400).json({ error: "Invalid otp." });

      if (!validatePassword(password))
        return res.status(400).json({
          error:
            "Password must be atleast 6 Characters long, contains capital Letter and special character.",
        });

      if (await existingLastPasswords(user.last_passwords, password))
        return res.status(400).json({
          error:
            "You have previously used this password, try with different password.",
        });

      if (!user.forgot_password[0].otp)
        return res
          .status(400)
          .json({ error: "Please generate Reset OTP First." });

      const check = user.forgot_password.at(-1);

      if (check.otp != otp)
        return res.status(400).json({ error: "Invalid Otp." });

      const currentdate = new Date();
      const otp_expires = new Date(check?.expires);

      if (currentdate > otp_expires)
        return res.status(410).json({ error: "OTP expired." });

      const passwordHash = await bcrypt.hash(password, 12);

      const update_log = {
        created_at: currentdate.toISOString(),
        msg: "Password Reset",
      };
      await Appusers.findOneAndUpdate(
        { _id: user._id },
        {
          $push: { update_log: update_log },
          $push: { last_passwords: passwordHash },
          $set: { password: passwordHash },
        }
      );

      res.status(200).json({ success: 1, msg: "Password has been reset." });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  app_user_by_id: async (req, res) => {
    try {
      const { id } = req.user;

      if (!id)
        return res.status(400).json({ error: "All feilds are required" });

      const query = { _id: id };
      const response_params = {
        _id: 1,
        first_name: 1,
        last_name: 1,
        nickname: 1,
        email: 1,
        status: 1,
        dob: 1,
        createdAt: 1,
        updatedAt: 1,
        avatar: 1,
      };

      const users = await Appusers.findOne(query, response_params);
      // const questionnaireScore = await QuestionnairesScore.find(id);
      console.log("id", id);
      const aggregatedScores = await FilledSurveys.find({ app_user_id: id });

      // console.log("aggregatedScores", aggregatedScores);
      const totalSurveyScore = aggregatedScores.reduce(
        (accumulator, currentValue) => {
          return accumulator + (currentValue.survey_score || 0); // Ensure to handle undefined or null values
        },
        1
      ); // Initial value of accumulator set to 0

      console.log("Total Survey Score:", totalSurveyScore);

      res
        .status(200)
        .json({ success: 1, data: { ...users._doc, score: totalSurveyScore } });
    } catch (err) {
      console.log(err);
      res.status(500).json({ msg: err.message });
    }
  },
  update_user_by_id: async (req, res) => {
    try {
      const {
        first_name,
        last_name,
        nickname,
        gender,
        dob,
        marital_status,
        email,
        password,
        user_type,
        linguistic_prefrences,
        education_level,
        cancer_type,
        tumor_stage,
        current_cancer_treatment,
        other_conditions,
        severity_of_symptoms,
        regular_checkup_reminders,
        regular_doctors_appointments,
        signature,
        privacy_policy,
        send_agreement_to_email,
        year_of_diagnose,
        FCMToken,
      } = req.body;
      const { id } = req.user;

      if (!id)
        return res.status(400).json({ error: "All fields are required" });

      // if (!first_name || !last_name || !dob)
      //   return res.status(400).json({ error: "All fields are required." });

      const user = await Appusers.findOne({ _id: id });

      if (email && !validateEmail(email))
        return res.status(400).json({ error: "Invalid email." });

      if (email && user.email !== email) {
        const emailExists = await Appusers.findOne({
          email: email.toLowerCase(),
        });
        if (emailExists)
          return res.status(400).json({ error: "Email already exists." });
      }

      let passwordHash = user.password;
      let update_log = user.update_log || [];

      if (password) {
        if (!validatePassword(password))
          return res
            .status(400)
            .json({ error: "Password requirements not met." });

        passwordHash = await bcrypt.hash(password, 12);

        if (await existingLastPasswords(user.last_passwords, password))
          return res.status(400).json({
            error:
              "You have previously used this password, try with different password.",
          });

        update_log.push({
          created_at: new Date().toISOString(),
          msg: "Password Reset",
        });
      }

      // await Appusers.findOneAndUpdate(
      //   { _id: id },
      //   {
      //     $set: {
      //       first_name,
      //       last_name,
      //       nickname: nickname || user.nickname,
      //       dob,
      //       email: email.toLowerCase() || user.email.toLowerCase(), // Keep the same email if not updated
      //       password: passwordHash,
      //       update_log: update_log,
      //       last_passwords: password ? [...user.last_passwords, passwordHash] : user.last_passwords,
      //     },
      //   }
      // );

      const data = await Appusers.findById(id);
      Object.assign(data, {
        first_name,
        last_name,
        nickname: nickname || user.nickname,
        dob,
        email: email.toLowerCase() || user.email.toLowerCase(), // Keep the same email if not updated
        password: passwordHash,
        update_log: update_log,
        last_passwords: password
          ? [...user.last_passwords, passwordHash]
          : user.last_passwords,
        gender,
        marital_status,
        user_type,
        linguistic_prefrences,
        education_level,
        cancer_type,
        tumor_stage,
        current_cancer_treatment,
        other_conditions,
        severity_of_symptoms,
        regular_checkup_reminders,
        regular_doctors_appointments,
        signature,
        privacy_policy,
        send_agreement_to_email,
        year_of_diagnose,
        FCMToken,
      });
      await data.save();
      res
        .status(200)
        .json({ success: 1, msg: "User Successfully Updated!", data: data });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  update_user_password_by_id: async (req, res) => {
    try {
      const { old_password, password } = req.body;
      const { id } = req.user;

      if (!id)
        return res.status(400).json({ error: "All fields are required" });

      if (!old_password || !password)
        return res.status(400).json({ error: "All fields are required." });

      if (!validatePassword(old_password))
        return res
          .status(400)
          .json({ error: "Old Password requirements not met." });

      if (!validatePassword(password))
        return res
          .status(400)
          .json({ error: "Password requirements not met." });

      const user = await Appusers.findOne({ _id: id });

      if (!(await existingLastPasswords(user.last_passwords, old_password)))
        return res.status(400).json({
          error:
            "You have not previously used this password, try with any previously used password.",
        });

      if (await existingLastPasswords(user.last_passwords, password))
        return res.status(400).json({
          error:
            "You have previously used this password, try with different password.",
        });

      let passwordHash = await bcrypt.hash(password, 12);

      let update_log = user.update_log || [];
      update_log.push({
        created_at: new Date().toISOString(),
        msg: "Password Reset",
      });

      await Appusers.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            password: passwordHash,
            update_log: update_log,
            last_passwords: password
              ? [...user.last_passwords, passwordHash]
              : user.last_passwords,
          },
        }
      );

      res
        .status(200)
        .json({ success: 1, msg: "Password Successfully Updated!" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  update_user_status_by_id: async (req, res) => {
    try {
      const { id } = req.user;

      if (!id)
        return res.status(400).json({ error: "All fields are required" });

      const user = await Appusers.findOne({ _id: id });

      if (!user || user.length <= 0)
        return res.status(400).json({ error: "User not found!" });
      // let update_log = user.update_log || [];
      // update_log.push({
      //   created_at: new Date().toISOString(),
      //   msg: "User Account Deactivated!",
      // });
      await activeUsers.findOneAndRemove({ appUserId: id });
      await Chat.findOneAndRemove({ customer: id });

      await Appusers.findOneAndRemove(
        { _id: id }
        // {
        //   $set: {
        //     status: 0,
        //     update_log: update_log,
        //   },
        // }
      );

      res
        .status(200)
        .json({ success: 1, msg: "Account Successfully Deactivated!" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  app_user_surveys: async (req, res) => {
    try {
      let { content_type } = req.query;
      content_type = content_type || "English";

      const { id } = req.user;

      if (!id)
        return res.status(400).json({ error: "All feilds are required" });

      const query = { status: 1, content_type };

      const response_params = {
        _id: 1,
        title: 1,
        description: 1,
      };

      const questions = await Questionnaires.find(query, response_params);

      // Fetch filled surveys for the user
      const filledSurveys = await FilledSurveys.find({ app_user_id: id });

      // Create a set of filled questionare_ids for faster lookup
      const filledSurveySet = new Set(
        filledSurveys.map((filledSurvey) =>
          filledSurvey.questionare_id.toString()
        )
      );

      // Append is_completed field and format the output
      const formattedSurveys = questions.map((question) => ({
        _id: question._id.toString(),
        title: question.title,
        description: question.description,
        is_completed: filledSurveySet.has(question._id.toString()),
      }));

      res.status(200).json({ success: 1, data: formattedSurveys });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  app_user_survey: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id)
        return res.status(400).json({ error: "All feilds are required" });

      const query = { status: 1, _id: id };

      const questions = await Questionnaires.find(query);

      res.status(200).json({ success: 1, data: questions });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  app_user_save_survey: async (req, res) => {
    try {
      const { survey } = req.body;
      const { id } = req.params;

      if (!id || !survey || survey.length == 0)
        return res.status(400).json({ error: "All feilds are required" });

      const record = await Questionnaires.findOne({ _id: id, status: 1 });
      if (!record)
        return res
          .status(400)
          .json({ error: "Incorrect question ID OR Survey is inactive." });

      // let iserror = false;
      // for (let index = 0; index < survey.length; index++) {
      //   const obj = record.questions.find((o) => o.question === survey[index].question);
      //   //FIND QUESTION
      //   if (!obj || survey[index].answer.length === 0) {
      //     iserror = true;
      //     break;
      //   }

      //   if (obj.type === "Dropdown") {
      //     for (const subAnswer of survey[index].answer) {
      //       const subQuestion = obj.options.find(
      //         (option) => option.sub_question === subAnswer.sub_question
      //       );
      //       if (
      //         !subQuestion ||
      //         !subAnswer.sub_answers.every((subAns) => subQuestion.sub_options.includes(subAns)) ||
      //         subAnswer.sub_answers.length === 0
      //       ) {
      //         iserror = true;
      //         break;
      //       }
      //     }
      //   } else {
      //     for (const answer of survey[index].answer) {
      //       if (!obj.options.includes(answer)) {
      //         iserror = true;
      //         break;
      //       }
      //     }
      //   }
      // }

      // if (iserror)
      //   return res.status(400).json({
      //     error: "Survery Question and Answer combination does not exist.",
      //   });

      const calculateTotalPoints = (survey) => {
        let totalPoints = 0;

        survey.forEach((question) => {
          if (question.answer && question.answer.points) {
            totalPoints += question.answer.points;
          } else if (question.answer && Array.isArray(question.answer)) {
            question.answer.forEach((subAnswer) => {
              if (subAnswer.sub_answers) {
                // subAnswer.sub_answers.forEach((subOption) => {
                totalPoints += subAnswer.sub_answers.points;

                // });
              }
            });
          }
        });

        return totalPoints;
      };

      // Example usage:
      // const survey = [
      //   // ... (your survey object)
      // ];

      const totalPoints = calculateTotalPoints(survey);
      console.log("Total Points:", totalPoints);

      console.log("survey", survey);

      const newFilledSurveys = new FilledSurveys({
        app_user_id: req.user.id,
        questionare_id: id,
        survey,
        survey_score: totalPoints,
      });

      await newFilledSurveys.save();

      res.status(200).json({
        success: 1,
        msg: "Survey Successfully Saved!",
        data: newFilledSurveys,
      });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  app_user_daily_reflections: async (req, res) => {
    try {
      const { id } = req.user;
      const { dated } = req.query;

      if (!id || !dated)
        return res.status(400).json({ error: "All feilds are required" });

      const formattedDate = new Date(dated);

      const query = { app_user_id: id, dated: formattedDate };

      const dailyreflections = await DailyReflections.find(query);

      res.status(200).json({ success: 1, data: dailyreflections });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  app_user_daily_reflections_save: async (req, res) => {
    try {
      const { id } = req.user;
      const { dated, thoughts } = req.body;

      if (!id || !dated || !thoughts)
        return res.status(400).json({ error: "All feilds are required" });

      const formattedDate = new Date(dated);

      const dailyreflections = new DailyReflections({
        app_user_id: id,
        dated: formattedDate,
        thoughts,
      });

      await dailyreflections.save();

      res.status(200).json({
        success: 1,
        data: "Saved your Daily Reflection in your journal",
      });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  app_user_daily_reflections_delete: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id)
        return res.status(400).json({ error: "All feilds are required" });

      await DailyReflections.findByIdAndDelete(id);

      res
        .status(200)
        .json({ success: 1, data: "Reflection has been deleted!" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  app_user_articles: async (req, res) => {
    try {
      let { content_type, article_type, score } = req.query;
      content_type = content_type || "English";

      const { id } = req.user;

      if (!id || !article_type)
        return res.status(400).json({ error: "All feilds are required" });

      // const query = { status: 1, content_type, article_type, };

      const query = {
        status: 1,
        content_type,
        article_type,
        // health_survey_score: { $elemMatch: $and{ min: { $gte: score } max: { $lte: score } } },
        // health_survey_score: {
        //   $elemMatch: {
        $and: [
          { "health_survey_score.min": { $lte: score } },
          { "health_survey_score.max": { $gte: score } },
        ],
        //   },
        // },
      };
      console.log(query);
      const articles = await Articles.find(query);

      res.status(200).json({ success: 1, data: articles });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  article_by_id: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id)
        return res.status(400).json({ error: "All feilds are required" });

      const query = { _id: id };

      const data = await Articles.find(query);

      res.status(200).json({ success: 1, data: data });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  app_user_myrecords_save: async (req, res) => {
    try {
      const { id } = req.user;
      const {
        blood_pressure_systole,
        blood_pressure,
        sugar_level,
        sleeping_hours,
        weight,
      } = req.body;

      if (
        !id ||
        !blood_pressure_systole ||
        !blood_pressure ||
        !sugar_level ||
        !sleeping_hours ||
        !weight
      )
        return res.status(400).json({ error: "All feilds are required" });

      const myrecords = new Myrecords({
        app_user_id: id,
        blood_pressure_systole,
        blood_pressure,
        sugar_level,
        sleeping_hours,
        weight,
      });

      await myrecords.save();

      res.status(200).json({ success: 1, data: "Saved Successfully" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  myrecords: async (req, res) => {
    try {
      const { id } = req.user;
      const { from_date, till_date } = req.query;

      if (!id || !till_date || !from_date)
        return res.status(400).json({ error: "All feilds are required" });

      // Convert till_date to a JavaScript Date object and add 1 day
      const toDate = new Date(till_date);
      toDate.setDate(toDate.getDate() + 1);

      const query = {
        app_user_id: id,
        createdAt: {
          $gte: new Date(from_date),
          $lt: new Date(toDate),
        },
      };

      const response_params = {
        _id: 0,
        blood_pressure_systole: 1,
        blood_pressure: 1,
        sugar_level: 1,
        sleeping_hours: 1,
        weight: 1,
        createdAt: 1,
      };

      const records = await Myrecords.find(query, response_params);

      res.status(200).json({ success: 1, data: records });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  app_user_pain_assessment_save: async (req, res) => {
    try {
      const { id } = req.user;
      const { category, scale } = req.body;

      if (!id || !category)
        return res.status(400).json({ error: "All feilds are required" });

      let scale_title = "";

      if (scale >= 0 && scale <= 1) {
        scale_title = "No Hurt";
      } else if (scale >= 2 && scale <= 3) {
        scale_title = "Hurts a little bit";
      } else if (scale >= 4 && scale <= 5) {
        scale_title = "Hurts a little more";
      } else if (scale >= 6 && scale <= 7) {
        scale_title = "Hurts an even more";
      } else if (scale >= 8 && scale <= 9) {
        scale_title = "Hurts a whole lot";
      } else if (scale === 10) {
        scale_title = "Hurts worst";
      }

      const myrecords = new Pain_assessments({
        app_user_id: id,
        category,
        scale,
        scale_title,
      });

      await myrecords.save();

      res.status(200).json({ success: 1, data: "Saved Successfully" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  pain_assessment: async (req, res) => {
    try {
      const { id } = req.user;
      const { from_date, till_date } = req.query;

      if (!id || !till_date || !from_date)
        return res.status(400).json({ error: "All feilds are required" });

      // Convert till_date to a JavaScript Date object and add 1 day
      const toDate = new Date(till_date);
      toDate.setDate(toDate.getDate() + 1);

      const query = {
        app_user_id: id,
        createdAt: {
          $gte: new Date(from_date),
          $lt: new Date(toDate),
        },
      };

      const response_params = {
        _id: 0,
        scale: 1,
        scale_title: 1,
        category: 1,
        createdAt: 1,
      };

      const records = await Pain_assessments.find(query, response_params);

      res.status(200).json({ success: 1, data: records });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  app_user_daily_tasks: async (req, res) => {
    try {
      const { id } = req.user;
      // const { from_date, to_date, task_type, content_type } = req.query;
      const { from_date, to_date, task_type, content_type, score } = req.query;

      // if (!id || !from_date || !to_date || !task_type || !content_type)
      //     return res.status(400).json({ error: "All fields are required" });

      if (!id || !task_type || !content_type)
        return res.status(400).json({ error: "All fields are required" });

      // const formattedfromDate = new Date(from_date);
      // const formattedtoDate = new Date(to_date);

      // Fetch records from dailytasksassign based on query parameters
      const dailyTasksAssignments = await Dailytaskassigns.find({
        app_user_id: id,
        // createdAt: {
        //     $gte: formattedfromDate,
        //     $lte: formattedtoDate,
        // },
        status: 1,
      });

      const taskIds = dailyTasksAssignments.map(
        (assignment) => assignment.task_id
      );

      // Fetch details of the tasks from dailytasks using task IDs
      const dailyTasks = await DailyTasks.find({
        _id: { $in: taskIds },
        task_type,
        content_type,
        $and: [
          { "health_survey_score.min": { $lte: score } },
          { "health_survey_score.max": { $gte: score } },
        ],
      });

      // const allDailyTask = await DailyTasks.find({
      //   is_all_users: true,
      //   task_type,
      //   content_type,
      //   $and: [
      //     { "health_survey_score.min": { $lte: score } },
      //     { "health_survey_score.max": { $gte: score } },
      //   ],
      // });
      // Append is_completed key to each task based on assignment data
      const newtasks = dailyTasks.map((task) => {
        const assignment = dailyTasksAssignments.find(
          (a) => a.task_id.toString() === task._id.toString(),
          { is_completed: false }
        );
        const { task_id, is_completed } = assignment;
        const {
          content_type,
          task_type,
          is_all_users,
          article_id,
          title,
          calendar,
          time,
          media_url,
          health_survey_score,
          q_les_qsf_score,
          qid_sr_score,
          cancer_type,
          tumor_stage,
          current_cancer_treatment,
          other_conditions,
          severity_of_symptoms,
          description,
        } = task;

        return {
          task_id,
          task_type,
          article_id,
          title,
          calendar,
          time,
          media_url,
          health_survey_score,
          q_les_qsf_score,
          qid_sr_score,
          cancer_type,
          tumor_stage,
          current_cancer_treatment,
          other_conditions,
          severity_of_symptoms,
          description,
          is_completed,
        };
      });
      // res.status(200).json({ success: 1, data: [ ...newtasks, ...allDailyTask  ] });
      res.status(200).json({ success: 1, data: newtasks });

      // if (newtasks.length == 0) {
      //   res.status(200).json({ success: 1, data: allDailyTask });
      // } else {
      //   res.status(200).json({ success: 1, data: newtasks });
      // }
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  complete_task_by_id: async (req, res) => {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      if (!id || !user_id)
        return res.status(400).json({ error: "All fields are required" });

      await Dailytaskassigns.findOneAndUpdate(
        { task_id: id, app_user_id: user_id },
        {
          $set: {
            is_completed: true,
          },
        }
      );

      res.status(200).json({ success: 1, msg: "Task Successfully Completed!" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  remove_task_by_id: async (req, res) => {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      if (!id)
        return res.status(400).json({ error: "All fields are required" });

      await Dailytaskassigns.findOneAndUpdate(
        { task_id: id, app_user_id: user_id },
        {
          $set: {
            status: 0,
          },
        }
      );

      res.status(200).json({ success: 1, msg: "Task Successfully Removed!" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  app_user_cares: async (req, res) => {
    try {
      let { content_type } = req.query;
      content_type = content_type || "English";

      const { id } = req.user;

      if (!id)
        return res.status(400).json({ error: "All feilds are required" });

      const query = { status: 1, content_type };

      const articles = await Articles.find(query).select("-__v -admin_id");
      console.log(articles);

      const withkeyarticles = articles.map((article) => {
        const userHasWatched = article.watched_by.some(
          (item) => item.app_user_id === id
        );
        const { watched_by, ...rest } = article.toObject();
        return {
          ...rest,
          is_watched: userHasWatched,
        };
      });

      res.status(200).json({ success: 1, data: withkeyarticles });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  app_user_cares_mark_as_done: async (req, res) => {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      if (!id || !user_id)
        return res.status(400).json({ error: "All fields are required" });

      const records = await Articles.find({ _id: id, status: 1 });

      if (!records || !records.length > 0)
        return res
          .status(400)
          .json({ error: "Incorrect ID / Article Disabled" });

      const userHasWatched = records[0].watched_by.some(
        (item) => item.app_user_id === user_id
      );

      if (userHasWatched)
        return res
          .status(400)
          .json({ error: "User already watched this video." });

      const watched_by = {
        app_user_id: user_id,
        watched_at: new Date().toISOString(),
      };

      await Articles.findOneAndUpdate(
        { _id: id },
        {
          $push: { watched_by },
        }
      );

      res
        .status(200)
        .json({ success: 1, msg: "Video/Article Successfully Completed!" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  app_user_update_avatar: async (req, res) => {
    try {
      const { id } = req.user;
      const file = req.files.file;

      // console.log("files", file);

      if (!file)
        return res.status(400).json({ error: "File is not uploaded!" });

      const { name, tempFilePath } = file;

      const uploadDirectory = "uploads/appusers/avatar/";
      const extension = path.extname(name);
      const randomFileName = `${Date.now()}${Math.floor(
        Math.random() * 10000
      )}${extension}`;
      const destinationPath = `${uploadDirectory}${randomFileName}`;

      await fs.move(tempFilePath, destinationPath);

      // const avatar = process.env.BASE_URL + "appuseravatar/" + randomFileName;
      // console.log(avatar, "./" + destinationPath);

      const firebaseFilePath = "appuseravatar/" + randomFileName;
      uploadImage("./" + destinationPath, firebaseFilePath);
      // console.log("firebaseFilePath", firebaseFilePath);
      const imageUrl = `appuseravatar%2F${randomFileName}?alt=media`;
      // console.log("firebaseUrl", imageUrl);

      await Appusers.findOneAndUpdate(
        { _id: id },
        {
          $set: { avatar: imageUrl },
        }
      );
      res.status(200).json({ success: 1, data: imageUrl });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  email_duplicate: async (req, res) => {
    try {
      const { email } = req.query;
      if (!email)
        return res.status(400).json({ error: "All feilds are required" });
      const query = {
        email: email.toLowerCase(),
      };
      const records = await Appusers.find(query);
      const is_exist = records.length > 0 ? true : false;
      res.status(200).json({ success: 1, data: is_exist });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  get_notification: async (req, res) => {
    const { id } = req.user;
    try {
      const allNotifications = await Notification.find({ is_all_users: true });
      const userNotifications = await Notification.find({ app_user_id: id });
      res.status(200).json({
        success: 1,
        data: [...allNotifications, ...userNotifications],
      });
    } catch (error) {
      res.status(200).json({ msg: error.message });
    }
  },
  read_Notication: async (req, res) => {
    const { Nid } = req.params;
    const { id } = req.user;
    console.log("id", id);
    try {
      const updatedNotification = await Notification.findByIdAndUpdate(
        Nid,
        { $addToSet: { read: id } },
        { new: true } // To get the updated document
      );

      if (!updatedNotification) {
        return res.status(404).json({
          success: 0,
          msg: "Notification not found",
        });
      }
      res.status(200).json({
        success: 1,
        msg: "Notification Updated",
      });
    } catch (error) {}
  },
};

const createAccessToken = (payload) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET_APPUSERS, {
    expiresIn: "365d",
  });
};

const createActivationToken = (payload) => {
  return jwt.sign(payload, process.env.ACTIVATION_TOKEN_SECRET_APPUSERS, {
    expiresIn: "5m",
  });
};

const createRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET_APPUSERS, {
    expiresIn: "7d",
  });
};

module.exports = appuserCtrl;
