const express = require('express');
const initObservationLists = express.Router();
const database = require('../Database/DatabaseConnection');



// récupère la liste des sites
initObservationLists.get('/initMessier', (request,response) =>
{
        let messierFirstId = 1;
        let messierLastId = 110;
        let initializeMessierList = "";

        for (let index = messierFirstId; index <= messierLastId; index ++)
        {
            initializeMessierList = initializeMessierList + `insert into observationlist_has_skyobjects Values (1,${index});`;
        }

        database
            .dbQuery(initializeMessierList)
            .then(() => response.send("MESSIER_LIST_INIT_SUCCESS"))
            .catch(() => response.send("MESSIER_LIST_INIT_FAIL"))
        
});

module.exports = initObservationLists;