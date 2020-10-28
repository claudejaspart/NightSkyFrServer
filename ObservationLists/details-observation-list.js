const express = require('express');
const observationListDetails = express.Router();
const database = require('../Database/DatabaseConnection');



// récupère les elements d'une liste donnée
observationListDetails.get('/observationListsDetails', (request,response) =>
{
        // variable erreur
        let erreur = false;

        // objet de retour contenant les données
        let objectDetailsList = [];

        // extraction ID
        let listId = request.query.id;

        // récupération des id des objets de la liste
        let getObservationListDetails = `select skyobject_id from observationlist_has_skyobjects where observationlist_id = ${listId} order by skyobject_id desc;`;
        
        database
            .dbQuery(getObservationListDetails)
            .then(data => 
            {
                let numberObjects = data.length;

                for (let index = 0; index < numberObjects; index++)
                {
                    if (data[index].skyobject_id <= 110)
                    {
                        // objets de messier
                        let getObjectDetails = `select concat('M', messierId) as name, objecttype as type, round(visualmagnitude,2) as magnitude from skyobjects where id = ${data[index].skyobject_id};`;
                        database
                        .dbQuery(getObjectDetails)
                        .then(objectDetails => 
                        {
                            // nombre d'observations associées
                            let numberObservationsQuery = `select count(observation_id) as result from skyobject_has_observations where skyobject_id =  ${data[index].skyobject_id};`;
                            
                            database
                            .dbQuery(numberObservationsQuery)
                            .then( numberObservations => 
                            {
                                let details = 
                                {
                                    "name" : objectDetails[0].name,
                                    "type" : objectDetails[0].type,
                                    "magnitude"  : objectDetails[0].magnitude,
                                    "number_observations" : numberObservations[0].result
                                };

                                objectDetailsList.push(details);

                                if (objectDetailsList.length === numberObjects)
                                {
                                    if (!erreur)
                                        response.send(objectDetailsList);
                                    else
                                        response.send("GET-OBS-DETAILS-FAIL");
                                }


                            })
                            .catch((err) => {console.log(err)})
                        })
                        .catch(() => {erreur = true;})
                    }
                    else
                    {
                        response.send("GET-OBS-DETAILS-EMPTY-FAIL");
                    }
                }

            })
            .catch(error => {response.send(error)})
            
});

module.exports = observationListDetails;