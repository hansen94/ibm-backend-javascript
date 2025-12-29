const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');

// Define the upload directory path
const directoryPath = 'public/images';

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath); // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  },
});

const upload = multer({ storage: storage });


// Get all secondChanceItems
router.get('/', async (req, res, next) => {
    logger.info('/ called');
    try {
        //Step 2: task 1 - insert code here
        const db = await connectToDatabase();
        //Step 2: task 2 - insert code here
        const itemCol = db.collection('secondChanceItems');
        //Step 2: task 3 - insert code here
        const items = await itemCol.find({}).toArray();
        //Step 2: task 4 - insert code here
        res.json(items);

        // const collection = db.collection("secondChanceItems");
        // const secondChanceItems = await collection.find({}).toArray();
        // res.json(secondChanceItems);
    } catch (e) {
        logger.console.error('oops something went wrong', e)
        next(e);
    }
});

// Add a new item
router.post('/', upload.single('file') ,async(req, res,next) => {
    try {

        //Step 3: task 1 - insert code here
        const db = await connectToDatabase();
        //Step 3: task 2 - insert code here
        const itemsCol = db.collection('secondChanceItems');
        //Step 3: task 3 - insert code here
        const data = req.body;
        //Step 3: task 4 - insert code here
        const lastItemQuery = itemsCol.find().sort({'id': -1}).limit(1);
        lastItemQuery.forEach(item => {
            data.id = (parseInt(item.id) + 1).toString();
        });
        //Step 3: task 5 - insert code here
        const curDate = Math.floor(new Date().getTime() / 1000);
        data.date_added = curDate;
        
        const addedItem = await itemsCol.insertOne(data);
        res.status(201).json(data);
    } catch (e) {
        next(e);
    }
});

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
    try {
        //Step 4: task 1 - insert code here
        const db = await connectToDatabase();
        //Step 4: task 2 - insert code here
        const itemsCol = db.collection('secondChanceItems');
        //Step 4: task 3 - insert code here
        const id = req.params.id;
        const secondChanceItem = await itemsCol.findOne({id: id});
        //Step 4: task 4 - insert code here
        if(secondChanceItem) {
            res.json(secondChanceItem);
        } else {
            return res.status(404).send("item not found");
        }
    } catch (e) {
        next(e);
    }
});

// Update and existing item
router.put('/:id', async(req, res,next) => {
    try {
        //Step 5: task 1 - insert code here
        const db = await connectToDatabase();
        //Step 5: task 2 - insert code here
        const itemsCol = db.collection('secondChanceItems');
        //Step 5: task 3 - insert code here
        const id = req.params.id;
        const existingItem = await itemsCol.findOne({id: id});
        if(!existingItem) {
            return res.status(404).send('item not found');
        }
        //Step 5: task 4 - insert code here
        existingItem.category = req.body.category;
        existingItem.condition = req.body.condition;
        existingItem.age_days = req.body.age_days;
        existingItem.description = req.body.description;
        existingItem.age_years = (existingItem.age_days / 365).toPrecision(1);
        existingItem.updatedAt = Math.floor(new Date().getTime() / 1000);
        const updateSuccess = await itemsCol.findOneAndUpdate(
            {id},
            { $set: existingItem },
            { returnDocument: 'after' },
        );
        //Step 5: task 5 - insert code here
        if(updateSuccess) {
            res.json({updated: 'success'});
        } else {
            res.json({updated: 'failed'});
        }
    } catch (e) {
        next(e);
    }
});

// Delete an existing item
router.delete('/:id', async(req, res,next) => {
    try {
        //Step 6: task 1 - insert code here
        const db = await connectToDatabase();
        //Step 6: task 2 - insert code here
        const itemsCol = db.collection('secondChanceItems');
        //Step 6: task 3 - insert code here
        const id = req.params.id;
        const itemToDelete = itemsCol.findOne({id: id});
        if(!itemToDelete) {
            res.status(404).send('item not found');
        }
        //Step 6: task 4 - insert code here
        const deleteItem = await itemsCol.deleteOne({id: id});
        if(deleteItem) {
            res.json({deleted: 'success'});
        }
    } catch (e) {
        next(e);
    }
});

module.exports = router;
