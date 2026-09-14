const express=require('express');
const router=express.Router();
const authController=require('../controllers/auth.controller')
const validate=require('../middleware/validate.middleware');
const {registerSchema,loginSchema}=require('../validations/auth.validation');
const authenticate = require('../middleware/auth.middleware');
const User = require('../models/user.model');
const rateLimiter = require('../../src/utils/rateLimiter');``


router.post('/register',rateLimiter({keyPrefix:"rate:register",limit:5,windowSeconds:60}),validate(registerSchema),authController.register);
router.post('/login',rateLimiter({keyPrefix:"rate:login",limit:5,windowSeconds:60}),validate(loginSchema),authController.login);
module.exports=router;