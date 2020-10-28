const express = require('express');
const observationList = express.Router();
const database = require('../Database/DatabaseConnection');



// récupère la liste des sites
observationList.get('/observationLists', (error,response) =>
{
        getObservationLists = `select id, name, description, '0' as number_objects, '0' as number_Observed_Objects, to_char(creationDate, 'DD/MM/YYYY') as creation_date from observationList`;

        database
            .dbQuery(getObservationLists)
            .then(data => {response.send(data)})
            .catch(error => {response.send(error)})
});

module.exports = observationList;