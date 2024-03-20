const mongoose = require("mongoose");

const dailytasksSchema = new mongoose.Schema(
  {
    content_type: {
      type: String,
      enum: ["English", "Arabic"],
      trim: true,
      required: [true, "Please enter content type"],
    },
    task_type: {
      type: String,
      enum: ["Article", "Video"],
      required: [true, "Please enter task type"],
      trim: true,
    },
    is_all_users: { type: Boolean, required: [true, "Please enter is all users"], trim: true },
    admin_id: { type: mongoose.Schema.Types.ObjectId, required: [true, "Admin User Required"] },
    app_user_id: { type: String, default: "" },
    article_id: { type: mongoose.Schema.Types.ObjectId, required: [true, "Article is Required"] },
    title: { type: String, required: [true, "Please enter title"], trim: true },
    calendar: {
      type: String,
      // required: [true, "Please enter today_date"],
      trim: true,
      validate: {
        validator: function (value) {
          // Custom validator function to check the format "YYYY-MM-DD"
          const pattern = /^\d{4}-\d{2}-\d{2}$/;
          return pattern.test(value);
        },
        message: 'Invalid date format. Please use "YYYY-MM-DD".',
      },
    },
    time: {
      type: String,
      // required: [true, "Please enter today_time"],
      trim: true,
      validate: {
        validator: function (value) {
          // Custom validator function to check the format "hh:mmAM"
          const pattern = /^(0?[1-9]|1[0-2]):[0-5][0-9](AM|PM)$/i;
          return pattern.test(value);
        },
        message: 'Invalid time format. Please use "hh:mmAM" or "hh:mmPM".',
      },
    },
    media_url: { type: String, required: [true, "Please enter media url"], trim: true },
    health_survey_score: {
      min: {
        type: Number,
        required: [true, "Please enter minimum health_survey_score"],
        trim: true,
      },
      max: {
        type: Number,
        required: [true, "Please enter maximum health_survey_score"],
        trim: true,
      },
    },
    q_les_qsf_score: {
      min: { type: Number, required: [true, "Please minimum enter q_les_qsf_score"], trim: true },
      max: { type: Number, required: [true, "Please maximum enter q_les_qsf_score"], trim: true },
    },
    qid_sr_score: {
      min: { type: Number, required: [true, "Please minimum enter qid_sr_score"], trim: true },
      max: { type: Number, required: [true, "Please maximum enter qid_sr_score"], trim: true },
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
      // required: [true, "Please enter cancer type"],
      default: "None",
      trim: true,
    },
    tumor_stage: {
      type: String,
      enum: ["None", "Stage I", "Stage II", "Stage III", "Stage IV"],
      // required: [true, "Please enter tumor type"],
      default: "None",
      trim: true,
    },
    current_cancer_treatment: {
      type: [String],
      enum: [
        "None",
        "Radiotherapy",
        "Chemotherapy",
        "Hormonal treatment",
        "No Treatments",
        "other",
      ],
      // required: [true, "Please enter tumor type"],
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
      // required: [true, "Please enter tumor type"],
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
      // required: [true, "Please enter tumor type"],
      default: "None",
      trim: true,
    },
    description: { type: String, default: "", trim: true },
    status: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("dailytasks", dailytasksSchema);
