const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller.js');

const validate=require('../middleware/validate.middleware.js');
const authenticate=require('../middleware/auth.middleware.js')
const {createUserSchema}=require('../validations/user.validation.js');


router.post("/", validate(createUserSchema), userController.createUser);
router.get("/getAll", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.patch("/:id",validate(createUserSchema),userController.updateUser);
router.get('/me',authenticate,userController.getCurrentUser)
router.post('/refresh',userController.refreshToken)

module.exports = router;