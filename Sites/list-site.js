const express = require('express');
const listSites = express.Router();
const database = require('./../Database/DatabaseConnection');


// récupère la liste des sites
listSitesRouter.get('/sites', (error,response) =>
{
        getSites = 'select * from sites;';

        database
            .dbQuery(getSites)
            .then(data => {response.send(data)})
            .catch(error => {response.send(error)})
});



module.exports = listSites;