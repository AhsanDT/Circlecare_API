const Users = require("../models/userModel");
const Appusers = require("../models/appuserModel");
const Questionares = require("../models/questionModel");
const Notification = require("../models/notificationModel");
const Articles = require("../models/articleModel");
const DailyTasks = require("../models/dailytaskModel");
const Dailytaskassigns = require("../models/dailytaskassignModel");
const TermsAndConditions = require("../models/terms_and_conditionsModel");
const privacypolicySchema = require("../models/privacy_policyModel");
const FilledSurveys = require("../models/filledsurverysModel");
const faqSchema = require("../models/faqModel");
const tutorialSchema = require("../models/tutorialModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const fs = require("fs-extra");
const path = require("path");
const { uploadImage, sendPushNotification } = require("../helper/UploadImageFirebase");
const activeUsers = require("../models/activeUsers");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const {
  validateEmail,
  generateOTP,
  addMinutesToTime,
  validatePassword,
  validateOTP,
  validateDate,
  validateDateOfBirth,
  isValidURL,
  existingLastPasswords,
  validateTime,
  sendEmail,
} = require("../helper/functions");
const Chat = require("../models/chatSupportModel");

// DEFINES
const otp_expire_minutes = 10;
const refresh_token_expire_minutes = 10080;
// Define allowed extensions for images and videos
const allowedImageExtensions = [".jpg", ".jpeg", ".png", ".gif"];
const allowedVideoExtensions = [".mp4", ".avi", ".mov", ".wmv", ".mkv"];

const userCtrl = {
  register: async (req, res) => {
    try {
      const { first_name, last_name, email, password } = req.body;

      if (!first_name || !last_name || !email || !password)
        return res.status(400).json({ error: "All feilds are required." });

      if (!validateEmail(email)) return res.status(400).json({ error: "Invalid email." });

      const check = await Users.findOne({ email });
      if (check) return res.status(400).json({ error: "Email already exist." });

      if (!validatePassword(password))
        return res.status(400).json({
          error:
            "Password must be atleast 6 Characters long, contains captial Letter and special character.",
        });

      const passwordHash = await bcrypt.hash(password, 12);
      // const otp = generateOTP()
      // const currentdate = new Date()
      // const otp_expires = addMinutesToTime(currentdate, otp_expire_minutes) // 1 => Minute
      // const newUser = new Users({
      //     first_name, last_name, email, password: passwordHash, last_passwords: [passwordHash] ,otp: otp, otp_expires: otp_expires
      // })

      // await newUser.save()

      const newUser = {
        first_name,
        last_name,
        email,

        // email: email.toLowerCase(),
        password: passwordHash,
      };

      const activation_token = createActivationToken(newUser);

      // let email_html = "Your OTP code is " + "<h1>" +  + "</h1>"

      // const msg = {
      //     to: 'mzaryabuddin@gmail.com',
      //     from: 'noreply@ntamgroup.com', // Use the email address or domain you verified above
      //     subject: 'Secure OTP Notification',
      //     text: 'Secure OTP Notification',
      //     html: 'Yout OTP Code is<strong>Your OTP Code</strong>',
      // }

      // const msg = {
      //     to: 'mzaryabuddin@gmail.com',
      //     from: 'noreply@ntamgroup.com', // Use the email address or domain you verified above
      //     subject: 'Secure OTP Notification',
      //     text: 'Secure OTP Notification',
      //     html: 'Yout OTP Code is<strong>Your OTP Code</strong>',
      // }

      // try {
      //     await sgMail.send(msg);
      // } catch (error) {
      //     console.error(error);
      // }

      res.status(200).json({
        success: 1,
        msg: "Activation link sent to your email please verify, expires in 10 minutes.",
        activation_token,
      });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  regenerate_otp: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) return res.status(400).json({ error: "All feilds are required." });

      if (!validateEmail(email)) return res.status(400).json({ error: "Invalid email." });

      const check = await Users.findOne({ email });
      if (!check) return res.status(400).json({ error: "Email does not exist." });

      if (check?.otp_verified) return res.status(400).json({ error: "Email already verified." });

      const otp = generateOTP();
      const currentdate = new Date();
      const otp_expires = addMinutesToTime(currentdate, otp_expire_minutes); // 1 => Minute

      await Users.findOneAndUpdate({ _id: check._id }, { otp, otp_expires });

      //SEND MAIL

      const msg = {
        to: email.toLowerCase(),
        // from: 'noreply@ntamgroup.com', // Use the email address or domain you verified above
        from: "no-reply@asanrealestate.co", // Use the email address or domain you verified above
        subject: "Secure OTP Notification",
        text: "Secure OTP Notification",
        html: "Yout OTP Code is <h1>" + otp + "</h1>",
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
      const { activation_token } = req.body;

      if (!activation_token) return res.status(400).json({ error: "All feilds are required." });

      const user = jwt.verify(activation_token, process.env.ACTIVATION_TOKEN_SECRET);

      const { first_name, last_name, email, password } = user;

      const check = await Users.findOne({ email: email.toLowerCase() });
      if (check) return res.status(400).json({ error: "Email already exist." });

      const newUser = new Users({
        first_name,
        last_name,
        email: email.toLowerCase(),
        password,
        last_passwords: [password],
      });

      await newUser.save();

      res.status(200).json({ success: 1, msg: "Account has been activated." });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  },
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) return res.status(400).json({ error: "All feilds are required" });

      if (!validateEmail(email)) return res.status(400).json({ error: "Invalid email." });

      if (!validatePassword(password))
        return res.status(400).json({
          error:
            "Password must be atleast 6 Characters long, contains captial Letter and special character.",
        });

      const user = await Users.findOne({ email: email.toLowerCase() });
      if (!user) return res.status(400).json({ error: "This email does not exist." });

      if (!user.status)
        return res.status(401).json({
          error: "User deactivated, Please contact with administrator!",
        });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: "Incorrect Password." });

      // if (!user.otp_verified)
      //     return res.status(400).json({ error: "Unverified Account." })

      if (!user.status)
        return res.status(400).json({ error: "Account Is Blocked. Please contact administrator" });

      // REFRESH TOKEN ISSUE
      // const refresh_token = createRefreshToken({ id: user.id })

      const access_token = createAccessToken({ id: user.id });

      const { id, first_name, last_name, status, avatar } = user;

      res.status(200).json({
        success: 1,
        msg: "Login Success!",
        access_token,
        user: { id, first_name, last_name, status, avatar },
      });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  getAccessToken: async (req, res) => {
    try {
      const { rf_token } = req.body;

      if (!rf_token) return res.status(400).json({ error: "Please Login!" });

      jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(400).json({ error: "Please Login!" });

        const access_token = createAccessToken({ id: user.id });

        return res.json({ access_token: "Bearer " + access_token });
      });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) return res.status(400).json({ error: "All feilds are required" });

      if (!validateEmail(email)) return res.status(400).json({ error: "Invalid email." });

      const user = await Users.findOne({ email: email.toLowerCase() });
      if (!user) return res.status(400).json({ error: "This email does not exist." });

      const otp = generateOTP();
      const currentdate = new Date();
      const expires = addMinutesToTime(new Date(), otp_expire_minutes);
      const otp_expires = {
        created_at: currentdate.toISOString(),
        expires: expires,
        otp,
      };

      await Users.findOneAndUpdate({ _id: user._id }, { $push: { forgot_password: otp_expires } });

      //SEND MAIL
      const msg = {
        to: email.toLowerCase(),
        // from: 'noreply@ntamgroup.com', // Use the email address or domain you verified above
        from: "noreply@saptech.com.pk", // Use the email address or domain you verified above
        subject: "Secure OTP Notification",
        text: "Secure OTP Notification",
        html: "Yout OTP Code is <h1>" + otp + "</h1>",
      };

      try {
        // await sgMail.send(msg);
        await sendEmail(msg);
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
  verifyforgotOTP: async (req, res) => {
    try {
      const { otp, email } = req.body;
      if (!email || !otp) return res.status(400).json({ error: "All feilds are required" });

      if (!validateEmail(email)) return res.status(400).json({ error: "Invalid email." });

      const user = await Users.findOne({ email: email.toLowerCase() });
      if (!user) return res.status(400).json({ error: "This email does not exist." });

      if (!validateOTP(otp)) return res.status(400).json({ error: "Invalid otp." });

      if (!user.forgot_password[0].otp)
        return res.status(400).json({ error: "Please generate Reset OTP First." });

      const check = user.forgot_password.at(-1);
      if (check.otp != otp) return res.status(400).json({ error: "Invalid Otp." });

      const currentdate = new Date();
      const otp_expires = new Date(check?.expires);

      if (currentdate > otp_expires) return res.status(410).json({ error: "OTP expired." });

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

      if (!validateEmail(email)) return res.status(400).json({ error: "Invalid email." });

      const user = await Users.findOne({ email: email.toLowerCase() });
      if (!user) return res.status(400).json({ error: "This email does not exist." });

      if (!validateOTP(otp)) return res.status(400).json({ error: "Invalid otp." });

      if (!validatePassword(password))
        return res.status(400).json({
          error:
            "Password must be atleast 6 Characters long, contains captial Letter and special character.",
        });

      if (await existingLastPasswords(user.last_passwords, password))
        return res.status(400).json({
          error: "You have previously used this password, try with different password.",
        });

      if (!user.forgot_password[0].otp)
        return res.status(400).json({ error: "Please generate Reset OTP First." });

      const check = user.forgot_password.at(-1);

      if (check.otp != otp) return res.status(400).json({ error: "Invalid Otp." });

      const currentdate = new Date();
      const otp_expires = new Date(check?.expires);

      if (currentdate > otp_expires) return res.status(410).json({ error: "OTP expired." });

      const passwordHash = await bcrypt.hash(password, 12);

      const update_log = {
        created_at: currentdate.toISOString(),
        msg: "Password Reset",
      };
      await Users.findOneAndUpdate(
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
  admin_user_listing: async (req, res) => {
    try {
      const query = {};
      const response_params = {
        _id: 1,
        first_name: 1,
        last_name: 1,
        email: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        avatar: 1,
      };

      const users = await Users.find(query, response_params);

      res.status(200).json({ success: 1, data: users });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  admin_user_by_id: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) return res.status(400).json({ error: "All feilds are required" });

      const query = { _id: id };
      const response_params = {
        _id: 1,
        first_name: 1,
        last_name: 1,
        email: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        avatar: 1,
      };

      const users = await Users.find(query, response_params);

      res.status(200).json({ success: 1, data: users });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  admin_user_update_avatar: async (req, res) => {
    try {
      const { id } = req.user;

      const file = req.files.file;
      console.log("files", file);

      if (!file) return res.status(400).json({ error: "File is not uploaded!" });

      const { name, tempFilePath } = file;

      const uploadDirectory = "uploads/admin/avatar/";
      const extension = path.extname(name);
      const randomFileName = `${Date.now()}${Math.floor(Math.random() * 10000)}${extension}`;
      const destinationPath = `${uploadDirectory}${randomFileName}`;

      await fs.move(tempFilePath, destinationPath);

      // const avatar = process.env.BASE_URL + "useravatar/" + randomFileName;
      const firebaseFilePath = "adminavatar/" + randomFileName;
      uploadImage("./" + destinationPath, firebaseFilePath);

      const imageUrl = `adminavatar%2F${randomFileName}?alt=media`;
      // console.log("firebaseFilePath", firebaseFilePath, "imageUrl", imageUrl);

      await Users.findOneAndUpdate(
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
  update_admin_user_by_id: async (req, res) => {
    try {
      const { id } = req.user;

      const { first_name, last_name, email, password } = req.body;

      if (!id || !first_name || !last_name || !email)
        return res.status(400).json({ error: "All feilds are required." });

      if (!validateEmail(email.toLowerCase()))
        return res.status(400).json({ error: "Invalid email." });

      let passwordHash;
      if (password) {
        if (!validatePassword(password))
          return res.status(400).json({
            error:
              "Password must be atleast 6 Characters long, contains captial Letter and special character.",
          });
        passwordHash = await bcrypt.hash(password, 12);
      }

      const user = await Users.findOne({ _id: id });
      if (!user) return res.status(400).json({ error: "Invalid User." });

      if (user.email !== email) {
        const check = await Users.findOne({ email: email.toLowerCase() });
        if (check) return res.status(400).json({ error: "Email already exist." });
      }

      let update = { first_name, last_name, email: email.toLowerCase() };
      if (password) update.password = passwordHash;

      await Users.findOneAndUpdate(
        { _id: id },
        passwordHash
          ? {
              $push: { last_passwords: passwordHash },
              $set: update,
            }
          : {
              $set: update,
            }
      );

      res.status(200).json({ success: 1, data: "Successfully Updated!" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  admin_user_delete_by_id: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) return res.status(400).json({ error: "All feilds are required" });

      let query = { _id: id };
      const users = await Users.find(query);

      if (!users || users.length <= 0) return res.status(400).json({ error: "User not found!" });

      // if (!users[0].status) return res.status(400).json({ error: "Already Deactivated!" });

      await Users.findOneAndRemove(
        { _id: id }
        // ,
        // {
        //   $set: { status: 0 },
        // }
      );

      res.status(200).json({ success: 1, data: "Account Successfully Deactivate!" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  app_user_listing: async (req, res) => {
    try {
      const query = {};
      const response_params = {
        _id: 1,
        first_name: 1,
        last_name: 1,
        nickname: 1,
        gender: 1,
        dob: 1,
        marital_status: 1,
        email: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        avatar: 1,
        user_type: 1,
        linguistic_prefrences: 1,
        education_level: 1,
        cancer_type: 1,
        tumor_stage: 1,
        current_cancer_treatment: 1,
        other_conditions: 1,
        severity_of_symptoms: 1,
        regular_checkup_reminders: 1,
        regular_doctors_appointments: 1,
        signature: 1,
        privacy_policy: 1,
        send_agreement_to_email: 1,
        year_of_diagnose: 1,
      };

      const users = await Appusers.find(query, response_params);

      res.status(200).json({ success: 1, data: users });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  app_user_by_id: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) return res.status(400).json({ error: "All feilds are required" });

      const query = { _id: id };
      const response_params = {
        _id: 1,
        first_name: 1,
        last_name: 1,
        nickname: 1,
        gender: 1,
        dob: 1,
        marital_status: 1,
        email: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        avatar: 1,
        user_type: 1,
        linguistic_prefrences: 1,
        education_level: 1,
        cancer_type: 1,
        tumor_stage: 1,
        current_cancer_treatment: 1,
        other_conditions: 1,
        severity_of_symptoms: 1,
        regular_checkup_reminders: 1,
        regular_doctors_appointments: 1,
        signature: 1,
        privacy_policy: 1,
        send_agreement_to_email: 1,
        year_of_diagnose: 1,
      };

      const users = await Appusers.find(query, response_params);
      const surveys = await FilledSurveys.find({ app_user_id: id });
      const questionareIds = surveys.map((assignment) => assignment.questionare_id);
      console.log("survey", surveys, "questionareIds", questionareIds);

      const questionares = await Questionares.find({ _id: { $in: questionareIds } });
      // const { title } = questionares;
      console.log("questionare", questionares);

      const survey = questionares.map((a) => {
        const { title } = a;
        return title;
      });
      console.log("title", survey);
      res.status(200).json({ success: 1, data: { users, survey } });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  app_user_delete_by_id: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) return res.status(400).json({ error: "All feilds are required" });

      let query = { _id: id };
      const users = await Appusers.find(query);

      if (!users || users.length <= 0) return res.status(400).json({ error: "User not found!" });

      // if (!users[0].status) return res.status(400).json({ error: "Already Deactivated!" });
      await activeUsers.findOneAndRemove({ appUserId: id });
            await Chat.findOneAndRemove({ customer: id });


      await Appusers.findOneAndRemove(
        { _id: id }
        // {
        //   $set: { status: 0 },
        // }
      );


      res.status(200).json({ success: 1, data: "Account Successfully Deactivate!" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  add_questionare: async (req, res) => {
    try {
      const { content_type, title, month, description, questions } = req.body;
      const { id } = req.user;

      if (!content_type || !title || !month || !questions || questions.length <= 0) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // VALIDATION
      const questions_types = ["Multiple Choice", "Checkboxes", "Dropdown"];
      const validQuestionTypes = questions.every((row) => questions_types.includes(row.type));
      const validQuestionRequired = questions.every((row) => typeof row.is_required === "boolean");
      const validQuestion = questions.every(
        (row) => typeof row.question === "string" && row.question != ""
      );
      const validOption = questions.every((row) => row.options.length > 0);

      if (!validQuestion) {
        return res.status(400).json({ msg: "Please enter question title" });
      }

      if (!validQuestionTypes) {
        return res.status(400).json({
          msg: "You can enter question types as: " + questions_types.toString(),
        });
      }

      if (!validQuestionRequired) {
        return res.status(400).json({ msg: "Boolean is expected in is_required" });
      }

      if (!validOption) {
        return res.status(400).json({ msg: "Every question atleast has one option." });
      }

      for (const question of questions) {
        if (question.type === "Dropdown") {
          for (const option of question.options) {
            if (
              !option.sub_question ||
              typeof option.sub_question !== "string" ||
              option.sub_question.trim() === ""
            ) {
              return res.status(400).json({
                msg: "Dropdown option must have a valid sub_question",
              });
            }
            if (
              !option.sub_options ||
              !Array.isArray(option.sub_options) ||
              option.sub_options.length === 0
            ) {
              return res.status(400).json({
                msg: "Dropdown option must have at least one sub_option",
              });
            }
          }
        }
      }

      const newQuestionnaire = new Questionares({
        admin_id: id,
        content_type,
        title,
        month,
        description,
        questions,
      });

      const Questionnaire = await newQuestionnaire.save();

      const newNotification = new Notification({
        admin_id: id,
        is_all_users: true,
        sender: id,
        content: "New Questionnaire Added kindly fill this",
        route: `questionnaire/${Questionnaire._id}`,
      });

      const notification = await newNotification.save();
      // const FCMTokens = await Appusers.find({},{ FCMToken: 1, _id: 0 });
      // sendPushNotification(FCMTokens,notification);

      // console.log("notification", notification);
      res.status(200).json({ success: 1, data: "Questionnaire Created Successfully!" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  questionare_listing: async (req, res) => {
    try {
      const query = {};

      const data = await Questionares.find(query);

      res.status(200).json({ success: 1, data: data });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  questionare_by_id: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) return res.status(400).json({ error: "All feilds are required" });

      const query = { _id: id };

      const data = await Questionares.find(query);

      res.status(200).json({ success: 1, data: data });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  questionare_records_by_id: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) return res.status(400).json({ error: "All feilds are required" });

      const params = {
        _id: 1,
        first_name: 1,
        last_name: 1,
        dob: 1,
        gender: 1,
      };

      const record = await Questionares.find({ _id: id });
      if (record.length <= 0) return res.status(400).json({ error: "Questionare does not exist!" });

      const appusers = await Appusers.find({}, params);
      const filledSurveys = await FilledSurveys.find({ questionare_id: id });

      // Create a map to efficiently check if a user has filled the survey
      const filledSurveyMap = new Map();
      filledSurveys.forEach((survey) => {
        if (survey.app_user_id) {
          filledSurveyMap.set(survey.app_user_id.toString(), true);
        }
      });

      // Append 'completed: false' to app users who have not filled the survey
      const updatedAppUsers = appusers.map((user) => {
        if (filledSurveyMap.get(user._id.toString())) {
          return { ...user._doc, completed: true };
        } else {
          return { ...user._doc, completed: false };
        }
      });

      res.status(200).json({ success: 1, data: updatedAppUsers });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  update_questionare_by_id: async (req, res) => {
    try {
      const { content_type, title, month, description, questions, status } = req.body;
      const { id } = req.params;

      if (!id) return res.status(400).json({ error: "All feilds are required" });

      if (!content_type || !title || !month || !questions || questions.length <= 0) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // VALIDATION
      const questions_types = ["Multiple Choice", "Checkboxes", "Dropdown"];
      const validQuestionTypes = questions.every((row) => questions_types.includes(row.type));
      const validQuestionRequired = questions.every((row) => typeof row.is_required === "boolean");
      const validQuestion = questions.every(
        (row) => typeof row.question === "string" && row.question != ""
      );
      const validOption = questions.every((row) => row.options.length > 0);

      if (!validQuestion) {
        return res.status(400).json({ msg: "Please enter question title" });
      }

      if (!validQuestionTypes) {
        return res.status(400).json({
          msg: "You can enter question types as: " + questions_types.toString(),
        });
      }

      if (!validQuestionRequired) {
        return res.status(400).json({ msg: "Boolean is expected in is_required" });
      }

      if (!validOption) {
        return res.status(400).json({ msg: "Every question atleast has one option." });
      }

      for (const question of questions) {
        if (question.type === "Dropdown") {
          for (const option of question.options) {
            if (
              !option.sub_question ||
              typeof option.sub_question !== "string" ||
              option.sub_question.trim() === ""
            ) {
              return res.status(400).json({
                msg: "Dropdown option must have a valid sub_question",
              });
            }
            if (
              !option.sub_options ||
              !Array.isArray(option.sub_options) ||
              option.sub_options.length === 0
            ) {
              return res.status(400).json({
                msg: "Dropdown option must have at least one sub_option",
              });
            }
          }
        }
      }

      const updatedQuestionnaire = await Questionares.findByIdAndUpdate(
        id,
        { content_type, title, month, description, questions, status },
        { new: true } // Return the updated document
      );

      if (!updatedQuestionnaire) {
        return res.status(404).json({ error: "Questionnaire not found" });
      }

      res.status(200).json({ success: 1, data: "Successfully Updated!" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  add_article: async (req, res) => {
    try {
      const {
        content_type,
        article_type,
        month,
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
        video_url,
      } = req.body;
      const { id } = req.user;

      if (
        !content_type ||
        !article_type ||
        !month ||
        !title ||
        !calendar ||
        !time ||
        !media_url ||
        health_survey_score.length <= 0 ||
        q_les_qsf_score.length <= 0 ||
        qid_sr_score.length <= 0 ||
        !cancer_type ||
        !tumor_stage ||
        !current_cancer_treatment ||
        !other_conditions ||
        !severity_of_symptoms ||
        !description
      ) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // if (!isValidURL(media_url))
      //   return res.status(400).json({ error: "Format Error, Incorrect URL." });

      if (article_type == "video" && !video_url)
        return res.status(400).json({
          error: "Video URL Is mendatory when selecting article type video.",
        });

      // if (video_url && !isValidURL(video_url))
      //   return res.status(400).json({ error: "Format Error, Incorrect Video URL." });

      if (health_survey_score[1] <= health_survey_score[0])
        return res.status(400).json({
          error: "Format Error, Recheck Health Survey Score Min Max.",
        });

      if (q_les_qsf_score[1] <= q_les_qsf_score[0])
        return res.status(400).json({ error: "Format Error, Recheck Q LES QSF Score Min Max." });

      if (qid_sr_score[1] <= qid_sr_score[0])
        return res.status(400).json({ error: "Format Error, Recheck QID SR Score Min Max." });

      const newArticles = new Articles({
        admin_id: id,
        content_type,
        article_type,
        month,
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
        video_url,
      });

      await newArticles.save();

      res.status(200).json({ success: 1, data: "Article Created Successfully!" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  add_article_media: async (req, res) => {
    try {
      const file = req.files.file;
      console.log("file", file);
      if (!file) return res.status(400).json({ error: "File is not uploaded!" });

      const { name, tempFilePath, size } = file;

      const maxFileSize = 15 * 1024 * 1024; // 5MB in bytes
      if (size > maxFileSize) {
        return res.status(400).json({
          error: "File size exceeds the maximum allowed size(15 MB)!",
        });
      }

      const uploadDirectory = "uploads/admin/article/";
      const extension = path.extname(name);

      // Check if the file extension is allowed (either image or video)
      if (
        !allowedImageExtensions.includes(extension.toLowerCase()) &&
        !allowedVideoExtensions.includes(extension.toLowerCase())
      ) {
        return res.status(400).json({ error: "Only image and video files are allowed!" });
      }

      const randomFileName = `${Date.now()}${Math.floor(Math.random() * 10000)}${extension}`;
      const destinationPath = `${uploadDirectory}${randomFileName}`;

      await fs.move(tempFilePath, destinationPath);

      const firebaseFilePath = "article/" + randomFileName;
      uploadImage("./" + destinationPath, firebaseFilePath);
      // console.log("firebaseFilePath", firebaseFilePath);
      // const imageUrl = `appuseravatar%2F${randomFileName}?alt=media`;
      const article_media_path = `article%2F${randomFileName}?alt=media`;
      console.log("article_media_path", article_media_path);
      res.status(200).json({ success: 1, data: article_media_path });
    } catch (err) {
      console.log(err);
      res.status(500).json({ msg: err.message });
    }
  },
  article_listing: async (req, res) => {
    try {
      const query = {};

      const data = await Articles.find(query);

      res.status(200).json({ success: 1, data: data });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  article_by_id: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) return res.status(400).json({ error: "All feilds are required" });

      const query = { _id: id };

      const data = await Articles.find(query);

      res.status(200).json({ success: 1, data: data });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  update_article_by_id: async (req, res) => {
    try {
      const {
        content_type,
        article_type,
        month,
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
        status,
      } = req.body;
      const { id } = req.params;

      if (!id) return res.status(400).json({ error: "All feilds are required" });

      if (
        !content_type ||
        !article_type ||
        !month ||
        !title ||
        !calendar ||
        !time ||
        !media_url ||
        health_survey_score.length <= 0 ||
        q_les_qsf_score.length <= 0 ||
        qid_sr_score.length <= 0 ||
        !cancer_type ||
        !tumor_stage ||
        !current_cancer_treatment ||
        !other_conditions ||
        !severity_of_symptoms ||
        !description
      ) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // VALIDATION
      // if (!isValidURL(media_url))
      //   return res.status(400).json({ error: "Format Error, Incorrect URL." });

      if (health_survey_score[1] <= health_survey_score[0])
        return res.status(400).json({
          error: "Format Error, Recheck Health Survey Score Min Max.",
        });

      if (q_les_qsf_score[1] <= q_les_qsf_score[0])
        return res.status(400).json({ error: "Format Error, Recheck Q LES QSF Score Min Max." });

      if (qid_sr_score[1] <= qid_sr_score[0])
        return res.status(400).json({ error: "Format Error, Recheck QID SR Score Min Max." });

      const updatedArticle = await Articles.findByIdAndUpdate(
        id,
        {
          content_type,
          article_type,
          month,
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
          status,
        },
        { new: true } // Return the updated document
      );

      if (!updatedArticle) {
        return res.status(404).json({ error: "Article not found" });
      }

      res.status(200).json({ success: 1, data: "Successfully Updated!" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  add_dailytask: async (req, res) => {
    try {
      const {
        content_type,
        task_type,
        is_all_users,
        title,
        app_user_id,
        article_id,
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
      } = req.body;
      const { id } = req.user;

      if (
        !content_type ||
        !task_type ||
        !id ||
        !article_id ||
        !title ||
        !calendar ||
        !time ||
        !media_url ||
        health_survey_score.length <= 0 ||
        q_les_qsf_score.length <= 0 ||
        qid_sr_score.length <= 0 ||
        !cancer_type ||
        !tumor_stage ||
        !current_cancer_treatment ||
        !other_conditions ||
        !severity_of_symptoms ||
        !description
      )
        return res.status(400).json({ error: "All fields are required" });

      if (!is_all_users && !app_user_id)
        return res.status(400).json({
          error: "App user id is mendatory when selecting specific user.",
        });

      // if (!isValidURL(media_url))
      //   return res.status(400).json({ error: "Format Error, Incorrect URL." });

      if (health_survey_score[1] <= health_survey_score[0])
        return res.status(400).json({
          error: "Format Error, Recheck Health Survey Score Min Max.",
        });

      if (q_les_qsf_score[1] <= q_les_qsf_score[0])
        return res.status(400).json({ error: "Format Error, Recheck Q LES QSF Score Min Max." });

      if (qid_sr_score[1] <= qid_sr_score[0])
        return res.status(400).json({ error: "Format Error, Recheck QID SR Score Min Max." });

      const newDailyTask = new DailyTasks({
        admin_id: id,
        content_type,
        article_id,
        task_type,
        is_all_users,
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
      });

      const savedDailyTask = await newDailyTask.save();

      const newNotification = new Notification({
        admin_id: id,
        is_all_users: is_all_users,
        app_user_id: app_user_id,
        sender: id,
        content: "New Daily Task Added kindly Complete your daily task",
        route: `articles/${article_id}`,
      });

      const notification = await newNotification.save();
      // console.log("notification", notification);

      const savedRecordId = savedDailyTask._id;

      if (is_all_users) {
        const records = await Appusers.find({ cancer_type });
        const associations = records.map((record) => ({
          task_id: savedRecordId,
          app_user_id: record._id,
        }));
        await Dailytaskassigns.insertMany(associations);
      } else {
        const newDailytaskassigns = new Dailytaskassigns({
          task_id: savedRecordId,
          app_user_id,
        });
        await newDailytaskassigns.save();
      }

      res.status(200).json({ success: 1, data: "Daily Task Created Successfully!" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  add_dailytask_media: async (req, res) => {
    try {
      const file = req.files.file;
      if (!file) return res.status(400).json({ error: "File is not uploaded!" });

      const { name, tempFilePath, size } = file;

      const maxFileSize = 30 * 1024 * 1024; // 5MB in bytes
      if (size > maxFileSize) {
        return res.status(400).json({
          error: "File size exceeds the maximum allowed size(15 MB)!",
        });
      }

      const uploadDirectory = "uploads/admin/dailytask/";
      const extension = path.extname(name);
      console.log("extension", extension);

      // Check if the file extension is allowed (either image or video)
      if (
        !allowedImageExtensions.includes(extension.toLowerCase()) &&
        !allowedVideoExtensions.includes(extension.toLowerCase())
      ) {
        return res.status(400).json({ error: "Only image and video files are allowed!" });
      }

      const randomFileName = `${Date.now()}${Math.floor(Math.random() * 10000)}${extension}`;
      const destinationPath = `${uploadDirectory}${randomFileName}`;

      await fs.move(tempFilePath, destinationPath);

      const firebaseFilePath = "dailytask/" + randomFileName;
      uploadImage("./" + destinationPath, firebaseFilePath);
      // console.log("firebaseFilePath", firebaseFilePath);
      // const imageUrl = `appuseravatar%2F${randomFileName}?alt=media`;

      const dailytask_media_path = `dailytask%2F${randomFileName}?alt=media`;

      res.status(200).json({ success: 1, data: dailytask_media_path });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  dailytask_listing: async (req, res) => {
    try {
      const query = {};

      const data = await DailyTasks.find(query);

      res.status(200).json({ success: 1, data: data });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  dailytask_by_id: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) return res.status(400).json({ error: "All feilds are required" });

      const query = { _id: id };

      const data = await DailyTasks.find(query);

      res.status(200).json({ success: 1, data: data });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  update_dailytask_by_id: async (req, res) => {
    try {
      const {
        content_type,
        task_type,
        title,
        article_id,
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
        status,
      } = req.body;
      const { id } = req.params;

      if (!id) return res.status(400).json({ error: "All feilds are required" });

      if (
        !content_type ||
        !task_type ||
        !id ||
        !article_id ||
        !title ||
        !calendar ||
        !time ||
        !media_url ||
        health_survey_score.length <= 0 ||
        q_les_qsf_score.length <= 0 ||
        qid_sr_score.length <= 0 ||
        !cancer_type ||
        !tumor_stage ||
        !current_cancer_treatment ||
        !other_conditions ||
        !severity_of_symptoms ||
        !description
      )
        return res.status(400).json({ error: "All fields are required" });

      // if (!is_all_users && !app_user_id)
      //     return res.status(400).json({ error: "App user id is mendatory when selecting specific user." });

      // if (!isValidURL(media_url))
      //   return res.status(400).json({ error: "Format Error, Incorrect URL." });

      if (health_survey_score[1] <= health_survey_score[0])
        return res.status(400).json({
          error: "Format Error, Recheck Health Survey Score Min Max.",
        });

      if (q_les_qsf_score[1] <= q_les_qsf_score[0])
        return res.status(400).json({ error: "Format Error, Recheck Q LES QSF Score Min Max." });

      if (qid_sr_score[1] <= qid_sr_score[0])
        return res.status(400).json({ error: "Format Error, Recheck QID SR Score Min Max." });

      const updatedDailyTask = await DailyTasks.findByIdAndUpdate(
        id,
        {
          content_type,
          task_type,
          title,
          article_id,
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
          status,
        },
        { new: true } // Return the updated document
      );

      if (!updatedDailyTask) {
        return res.status(404).json({ error: "Daily Task not found" });
      }

      res.status(200).json({ success: 1, data: "Successfully Updated!" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  add_terms_and_condition: async (req, res) => {
    try {
      const { text } = req.body;
      const { id } = req.user;

      if (!text || !id) return res.status(400).json({ error: "All fields are required" });

      // Delete all existing records
      await TermsAndConditions.deleteMany({});

      const newTermsAndCondition = new TermsAndConditions({
        admin_id: id,
        text,
      });

      await newTermsAndCondition.save();

      res.status(200).json({
        success: 1,
        data: "Terms And Conditions Created Successfully!",
      });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  add_privacy_policy: async (req, res) => {
    try {
      const { text } = req.body;
      const { id } = req.user;

      if (!text || !id) return res.status(400).json({ error: "All fields are required" });

      // Delete all existing records
      await privacypolicySchema.deleteMany({});

      const newprivacypolicySchema = new privacypolicySchema({
        admin_id: id,
        text,
      });

      await newprivacypolicySchema.save();

      res.status(200).json({ success: 1, data: "Privacy Policy Created Successfully!" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  add_faq: async (req, res) => {
    try {
      const { text } = req.body;
      const { id } = req.user;

      if (!text || !id) return res.status(400).json({ error: "All fields are required" });

      // Delete all existing records
      await faqSchema.deleteMany({});

      const newfaqSchema = new faqSchema({
        admin_id: id,
        text,
      });

      await newfaqSchema.save();

      res.status(200).json({ success: 1, data: "FAQ Created Successfully!" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  add_tutorial: async (req, res) => {
    try {
      const { text } = req.body;
      const { id } = req.user;

      if (!text || !id) return res.status(400).json({ error: "All fields are required" });

      // Delete all existing records
      await tutorialSchema.deleteMany({});

      const newtutorialSchema = new tutorialSchema({
        admin_id: id,
        text,
      });

      await newtutorialSchema.save();

      res.status(200).json({ success: 1, data: "Tutorial Created Successfully!" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  admin_user_info: async (req, res) => {
    try {
      const { id } = req.user;

      if (!id) return res.status(400).json({ error: "All feilds are required" });

      const query = { _id: id };
      const response_params = {
        _id: 1,
        first_name: 1,
        last_name: 1,
        email: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        avatar: 1,
      };

      const users = await Users.find(query, response_params);

      res.status(200).json({ success: 1, data: users });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  get_terms_and_condition: async (req, res) => {
    try {
      const query = {};

      const data = await TermsAndConditions.find(query);

      res.status(200).json({ success: 1, data: data });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  get_privacy_policy: async (req, res) => {
    try {
      const query = {};

      const data = await privacypolicySchema.find(query);

      res.status(200).json({ success: 1, data: data });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  get_faq: async (req, res) => {
    try {
      const query = {};

      const data = await faqSchema.find(query);

      res.status(200).json({ success: 1, data: data });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  get_tutorial: async (req, res) => {
    try {
      const query = {};

      const data = await tutorialSchema.find(query);

      res.status(200).json({ success: 1, data: data });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  get_dashboard: async (req, res) => {
    try {
      const { start_date, end_date } = req.query;

      // Parse the start_date and end_date to Date objects
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      endDate.setDate(endDate.getDate() + 1);

      const matchQuery = {
        createdAt: {
          $gte: startDate, // Start date
          $lt: endDate, // End date
        },
      };

      const registrationCounts_admin = await Users.aggregate([
        {
          $match: matchQuery, // Filter by date range
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            users: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            users: 1,
          },
        },
        {
          $sort: { date: 1 },
        },
      ]);

      const registrationCounts_app = await Appusers.aggregate([
        {
          $match: matchQuery, // Filter by date range
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            users: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            users: 1,
          },
        },
        {
          $sort: { date: 1 },
        },
      ]);

      const admin_users_count = await Users.countDocuments();
      const app_users_count = await Appusers.countDocuments();
      const surveys = await Questionares.countDocuments();
      const articles = await Articles.countDocuments();

      let dashboard = {
        admin_users: registrationCounts_admin,
        app_users: registrationCounts_app,
        all_admin_users: admin_users_count,
        all_app_users: app_users_count,
        all_surverys: surveys,
        all_articles: articles,
      };

      res.status(200).json({ success: 1, data: dashboard });
    } catch (err) {
      console.error(err); // Log the error for debugging
      res.status(500).json({ msg: err.message });
    }
  },
  app_dailytask_delete_by_id: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) return res.status(400).json({ error: "All feilds are required" });

      let query = { _id: id };
      const dailytask = await DailyTasks.find(query);

      if (!dailytask || dailytask.length <= 0)
        return res.status(400).json({ error: "DailyTask not found!" });

      // if (!dailytask[0].status) return res.status(400).json({ error: "Already Deactivated!" });

      await DailyTasks.findOneAndUpdate(
        { _id: id },
        {
          $set: { status: 0 },
        }
      );

      res.status(200).json({ success: 1, data: "DailyTask Successfully Deactivate!" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  app_article_delete_by_id: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) return res.status(400).json({ error: "All feilds are required" });

      let query = { _id: id };
      const article = await Articles.find(query);

      if (!article || article.length <= 0)
        return res.status(400).json({ error: "Article not found!" });

      // if (!article[0].status) return res.status(400).json({ error: "Already Deactivated!" });

      await Articles.findOneAndRemove(
        { _id: id }
        // {
        //   $set: { status: 0 },
        // }
      );

      res.status(200).json({ success: 1, data: "Article Successfully Deactivate!" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  app_questionare_delete_by_id: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) return res.status(400).json({ error: "All feilds are required" });

      let query = { _id: id };
      const questionare = await Questionares.find(query);

      if (!questionare || questionare.length <= 0)
        return res.status(400).json({ error: "Questionares not found!" });

      // if (!questionare[0].status) return res.status(400).json({ error: "Already Deactivated!" });

      await FilledSurveys.deleteMany({ questionare_id: id });
      await Questionares.findOneAndRemove(
        { _id: id }
        // ,
        // {
        //   $set: { status: 0 },
        // }
      );
      // await FilledSurveys.findOneAndRemove({ questionare_id: id }),
      res.status(200).json({ success: 1, data: "Questionares Successfully Deactivate!" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
  searchUsers: async (req, res) => {
    // const { search } = req.query;
    // const id = req.Id
    // console.log("id",id)
    const search = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: "i" } },
            { email: { $regex: req.query.search, $options: "i" } },
          ],
        }
      : {};

    const users = await Appusers.find({ $and: [search] });
    res.status(200).send(users);
  },
  active_Users: async (req, res) => {
    try {
      const users = await activeUsers
        .find({})
        .populate({ path: "appUserId", select: "first_name last_name avatar" });
      res.status(200).json(users);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
};

const createActivationToken = (payload) => {
  return jwt.sign(payload, process.env.ACTIVATION_TOKEN_SECRET, {
    expiresIn: "10m",
  });
};

const createAccessToken = (payload) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "365d",
  });
};

const createRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};

module.exports = userCtrl;
