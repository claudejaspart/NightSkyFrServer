const express = require('express');
const newObservationListRouter = express.Router();
const bodyParser = require('body-parser');
const database = require('../Database/DatabaseConnection');

newObservationListRouter.use(bodyParser.urlencoded({ extended: false }));
newObservationListRouter.use(bodyParser.json());




// ************************************************
//
//            AJOUT D'UNE LISTE D'OBSERVATION
//
// ************************************************
newObservationListRouter.post('/addObservationList',  (request, response) =>
{
  
  name = request.body.name;
  description = request.body.description;

  // requete sql
  insertObsList = `insert into observationList values (DEFAULT, '${name}', '${description}', DEFAULT ) RETURNING id;`;
  database.dbQuery(insertObsList)
          .then(() => response.send("DB-NEW-OBSLIST-SUCCESS"))
          .catch(error => response.send(error));
  
});


module.exports = newObservationListRouter;









    


















     




















