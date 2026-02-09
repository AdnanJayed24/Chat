const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const { createChat, getChats, getMessages } = require("../controllers/chat.controller");

router.post("/", auth, createChat);
router.get("/", auth, getChats);
router.get("/:chatId/messages", auth, getMessages);

module.exports = router;
