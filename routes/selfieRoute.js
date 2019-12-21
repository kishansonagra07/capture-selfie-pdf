const express = require("express");
const selfieController = require("../controllers/selfieController");
const router = express.Router();

router
    .route('/take-selfie')
    .post(selfieController.checkBody, selfieController.takeSelfie);

router
    .route('/selfie-list')
    .get(selfieController.checkToken,selfieController.selfieList)
router
    .route('/make-pdf/:id')
    .get(selfieController.checkToken,selfieController.makePdf)

router
    .route('/delete-selfie/:id')
    .delete(selfieController.checkToken, selfieController.deleteSelfie)

module.exports = router;