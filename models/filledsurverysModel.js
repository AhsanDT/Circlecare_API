const mongoose = require("mongoose");

const filledsurveysSchema = mongoose.Schema(
  {
    app_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appusers",
      required: [true, "User Required"],
    },
    questionare_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Questionnaires",
      required: [true, "Survey Required"],
    },
    survey_score: {
      type: Number,
    },
       survey: {
      type: Array,
      required: [true, "Please enter survey"],
      validate: {
        validator: function (array) {
          return array.length > 0;
        },
        message: "Survey must be filled"
      },
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FilledSurveys", filledsurveysSchema);
