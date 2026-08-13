const express = require('express');
const router = express.Router();
const salonComunalController = require('../controllers/salonComunalController');

// GET all salon_comunal
router.get('/', salonComunalController.getAllSalonComunal);

// GET salon_comunal by ID
router.get('/:id', salonComunalController.getSalonComunalById);

// CREATE salon_comunal
router.post('/', salonComunalController.createSalonComunal);

// UPDATE salon_comunal
router.put('/:id', salonComunalController.updateSalonComunal);

// DELETE salon_comunal
router.delete('/:id', salonComunalController.deleteSalonComunal);

module.exports = router;
