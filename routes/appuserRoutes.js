const router = require("express").Router();
const appuserCtrl = require("../controller/appuserCtrl");
const appauth = require("../middleware/appauth");
const uploadImage = require("../middleware/uploadImage");

router.post("/api/google", appuserCtrl.googleAuth);

router.post("/register", appuserCtrl.register);
router.post("/regenerate-otp", appuserCtrl.regenerate_otp);
router.post("/activate", appuserCtrl.activateEmail);
router.post("/login", appuserCtrl.login);
router.post("/forgot", appuserCtrl.forgotPassword);
router.post("/verifyotp", appuserCtrl.verifyforgotOTP);
router.patch("/reset", appuserCtrl.resetPassword);

router.get("/app-user", appauth, appuserCtrl.app_user_by_id);
router.put("/app-user", appauth, appuserCtrl.update_user_by_id);
router.patch("/app-user", appauth, appuserCtrl.update_user_password_by_id);
router.delete(
  "/app-user-delete",
  appauth,
  appuserCtrl.update_user_status_by_id
);

router.patch(
  "/app-user-update-avatar",
  appauth,
  uploadImage,
  appuserCtrl.app_user_update_avatar
);

router.get("/health-surveys", appauth, appuserCtrl.app_user_surveys);
router.get("/health-survey/:id", appauth, appuserCtrl.app_user_survey);
router.post("/health-survey/:id", appauth, appuserCtrl.app_user_save_survey);

router.get("/articles", appauth, appuserCtrl.app_user_articles);
router.get("/articles/:id", appauth, appuserCtrl.article_by_id);

router.get("/cares", appauth, appuserCtrl.app_user_cares);
router.post(
  "/care-mark-as-done/:id",
  appauth,
  appuserCtrl.app_user_cares_mark_as_done
);

router.get(
  "/daily-reflections",
  appauth,
  appuserCtrl.app_user_daily_reflections
);
router.post(
  "/daily-reflection",
  appauth,
  appuserCtrl.app_user_daily_reflections_save
);
router.delete(
  "/daily-reflection/:id",
  appauth,
  appuserCtrl.app_user_daily_reflections_delete
);

router.get("/daily-tasks", appauth, appuserCtrl.app_user_daily_tasks);
router.patch("/complete-task/:id", appauth, appuserCtrl.complete_task_by_id);
router.patch("/remove-task/:id", appauth, appuserCtrl.remove_task_by_id);

router.post("/myrecords", appauth, appuserCtrl.app_user_myrecords_save);
router.get("/myrecords", appauth, appuserCtrl.myrecords);

router.post(
  "/pain-assessment",
  appauth,
  appuserCtrl.app_user_pain_assessment_save
);
router.get("/pain-assessment", appauth, appuserCtrl.pain_assessment);

router.get("/is-email-duplicate", appuserCtrl.email_duplicate);
router.get("/notification", appauth, appuserCtrl.get_notification);
router.patch("/notification-read/:Nid", appauth, appuserCtrl.read_Notication);

module.exports = router;
