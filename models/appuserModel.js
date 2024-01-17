const mongoose = require("mongoose");

const appuserSchema = mongoose.Schema(
  {
    first_name: { type: String, trim: true },
    last_name: { type: String, trim: true },
    nickname: { type: String, default: "nickname", trim: true },
    gender: { type: String, enum: ["Male", "Female", "other"], trim: true },
    dob: { type: String, trim: true },
    marital_status: { type: String, enum: ["Single", "Married", "Divorced", "other"], trim: true },
    email: { type: String, required: [true, "Please enter your email"], trim: true, unique: true },
    password: { type: String, required: [true, "Please enter your password"], trim: true },
    status: { type: Number, default: 1 },
    forgot_password: { type: Array, default: [] },
    update_log: { type: Array, default: [] },
    last_passwords: { type: Array, default: [] },
    avatar: {
      type: String,
      default:
        "https://www.kindpng.com/picc/m/24-248729_stockvader-predicted-adig-user-profile-image-png-transparent.png",
    },

    user_type: { type: String, enum: ["Patient", "Caregiver"], trim: true },
    linguistic_prefrences: { type: String, enum: ["English", "Arabic"], trim: true },
    education_level: {
      type: String,
      enum: ["High School Graduate", "College Graduate", "other"],
      trim: true,
    },

    cancer_type: {
      type: String,
      enum: [
        "None",
        "Bladder Cancer",
        "Breast Cancer",
        "Kidney Cancer",
        "Thyroid Cancer",
        "Cervical Cancer",
        "Colorectal Cancer",
        "Gynecological Cancer",
        "Head and neck cancers",
        "Liver cancer",
        "Lung Cancer",
        "Lymphoma",
        "Mesothelioma",
        "Myeloma",
        "Ovarian cancer",
        "Prostate cancer",
        "Skin cancer",
        "Uterine cancer",
        "Vaginal and vulvar cancers",
      ],
      default: "None",
      trim: true,
    },
    tumor_stage: {
      type: String,
      enum: ["None", "Stage I", "Stage II", "Stage III", "Stage IV"],
      default: "None",
      trim: true,
    },
    current_cancer_treatment: {
      type: [String],
      default: "None",
      trim: true,
    },
    other_conditions: {
      type: String,
      enum: [
        "None",
        "Hypertension",
        "Diabetes",
        "Heart conditions",
        "HIV",
        "HBV",
        "HCV",
        "Bipolar Disorder",
        "Depression",
        "Schizophrenia",
        "Respiratory diseases",
        "Cerebrovascular disease",
        "Kidney disease",
        "Liver disease",
        "Lung diseases",
        "Disabilities",
        "Obesity",
        "Blood diseases",
        "Pregnancy or recent pregnancy",
        "Smoking (current and former)",
        "Solid organ or blood stem cell transplantation",
        "Use of corticosteroids or other immunosuppressive medications",
      ],
      default: "None",
      trim: true,
    },
    severity_of_symptoms: {
      type: String,
      enum: [
        "None",
        "Depression",
        "Anxiety",
        "Distress",
        "Impact on quality of life",
        "Psychosocial impact",
      ],
      default: "None",
      trim: true,
    },
    regular_checkup_reminders: {
      type: String,
      enum: ["None", "Per Week", "Per Month", "Every 3 Months", "Every 4-6 Months"],
      default: "None",
      trim: true,
    },
    regular_doctors_appointments: {
      type: String,
      enum: [
        "None",
        "Per Week",
        "Per 02 Week",
        "Per Month",
        "Per 02 Month",
        "Per 3-4 Month",
        "Per 6 Month",
      ],
      default: "None",
      trim: true,
    },
    year_of_diagnose: {
      type: Number,
    },
    signature: { type: String },
    privacy_policy: { type: Boolean },
    send_agreement_to_email: { type: Boolean },

    // q_points: { type: Array },
    FCMToken: { type: String },
    googleAuth: {
      type: Boolean,
    },
    appleId: {
      type: String,
    },
    googleId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Appusers", appuserSchema);
