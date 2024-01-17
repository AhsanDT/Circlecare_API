const mongoose = require("mongoose");
const questionnaireScoreSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appusers",
  },
  questionnaireId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Questionnaires",
  },
  score: {
    type: Number,
  },
});

const QuestionnairesScore = mongoose.model("questionnaireScore", questionnaireScoreSchema);
module.exports = (QuestionnairesScore);
