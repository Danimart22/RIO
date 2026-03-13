import { Router } from "express";
const router = Router()

import * as authCtrl from '../controllers/auth.controller.js'
import { authJwt, verifySignup } from "../middlewares/index.js";

router.post('/signin', authCtrl.signin)
router.post('/signupImport', [authJwt.verifyToken, authJwt.userRRHH], authCtrl.signUpImport)
router.post('/signup', verifySignup.checkDuplicateUser, verifySignup.checkRolesExisted, authCtrl.signUp)

export default router;