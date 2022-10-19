const { Router } = require('express');
const authController = require('../controllers/authController');
const { requireAuth, checkUser } = require('../middleware/authMiddleware');
const router = Router();

router.post('/signup', authController.signup_post);
//router.post('/verif', authController.verif);
router.post('/login', authController.login_post);
router.get('/logout', authController.logout_get);


router.post('/send_email/',authController.send_email);
router.post('/verify_code/',authController.verify_code);
router.put('/change_pass/',authController.change_pass);

router.get('/testKey',authController.testKey);


// Crud of food 




module.exports = router;