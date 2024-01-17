const router = require("express").Router();
const userCtrl = require("../controller/userCtrl");
const auth = require("../middleware/auth");
const uploadImage = require("../middleware/uploadImage");

router.post("/register", userCtrl.register);
router.post("/regenerate-otp", userCtrl.regenerate_otp);
router.post("/activate", userCtrl.activateEmail);
router.post("/login", userCtrl.login);
router.post("/forgot", userCtrl.forgotPassword);
router.post("/verifyotp", userCtrl.verifyforgotOTP);
router.patch("/reset", userCtrl.resetPassword);


router.get("/dashboard", auth, userCtrl.get_dashboard);

router.get("/admin-user-listing", auth, userCtrl.admin_user_listing);
router.get("/admin-user-by-id/:id", auth, userCtrl.admin_user_by_id);
router.delete("/admin-user-by-id/:id", auth, userCtrl.admin_user_delete_by_id);
router.get("/admin-user-info", auth, userCtrl.admin_user_info);
router.patch("/admin-update-avatar", auth, uploadImage, userCtrl.admin_user_update_avatar);

router.patch("/admin-update-info", auth, userCtrl.update_admin_user_by_id);

router.post("/questionare", auth, userCtrl.add_questionare);
router.get("/questionare", auth, userCtrl.questionare_listing);
router.get("/questionare/:id", auth, userCtrl.questionare_by_id);
router.patch("/questionare/:id", auth, userCtrl.update_questionare_by_id);
router.get("/questionare-records/:id", auth, userCtrl.questionare_records_by_id);
router.delete("/questionare/:id", auth, userCtrl.app_questionare_delete_by_id);

router.post("/dailytask", auth, userCtrl.add_dailytask);
router.post("/dailytask_media", auth, userCtrl.add_dailytask_media);

router.get("/dailytask", auth, userCtrl.dailytask_listing);
router.get("/dailytask/:id", auth, userCtrl.dailytask_by_id);
router.patch("/dailytask/:id", auth, userCtrl.update_dailytask_by_id);
router.delete("/dailytask/:id", auth, userCtrl.app_dailytask_delete_by_id);

router.post("/article", auth, userCtrl.add_article);
router.post("/article_media", auth, uploadImage, userCtrl.add_article_media);

router.get("/article", auth, userCtrl.article_listing);
router.get("/article/:id", auth, userCtrl.article_by_id);
router.patch("/article/:id", auth, userCtrl.update_article_by_id);
router.delete("/article/:id", auth, userCtrl.app_article_delete_by_id);

router.post("/terms-and-conditions", auth, userCtrl.add_terms_and_condition);
router.get("/terms-and-conditions", userCtrl.get_terms_and_condition);
router.post("/privacy-policy", auth, userCtrl.add_privacy_policy);
router.get("/privacy-policy", userCtrl.get_privacy_policy);
router.post("/faq", auth, userCtrl.add_faq);
router.get("/faq", userCtrl.get_faq);
router.post("/tutorial", auth, userCtrl.add_tutorial);
router.get("/tutorial", userCtrl.get_tutorial);

router.get("/app-user-listing", auth, userCtrl.app_user_listing);
router.get("/app-user-by-id/:id", auth, userCtrl.app_user_by_id);
router.delete("/app-user-by-id/:id", auth, userCtrl.app_user_delete_by_id);

router.get('/user?',auth,userCtrl.searchUsers)
router.get('/activeUsers',auth,userCtrl.active_Users)


module.exports = router;
