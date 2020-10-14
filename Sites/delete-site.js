const express = require('express');
const deleteSiteRouter = express.Router();
const database = require('./../Database/DatabaseConnection');
const bodyParser = require('body-parser');
const fs  = require('fs');

deleteSiteRouter.use(bodyParser.urlencoded({ extended: false }));
deleteSiteRouter.use(bodyParser.json());


// ************************************************
//
//             SUPPRIME UN SITE
//
// ************************************************
deleteSiteRouter.delete('/deleteSite', (request,response)=>
{
  // récupération des parametres
  let siteId = request.query.siteId;

  // variable d'erreur
  let erreur = false;

  // suppression des images (fichiers physiques, lignes et relations)
  // recuperation des id et des chemins des images
  let getImagesData = `select id, path from images where id in (select image_id from site_has_images where site_id=${siteId})`;
  
  database.dbQuery(getImagesData)
        .then( (resGetImagesData ) =>
        {
            let numberFiles = resGetImagesData.length;

            if (numberFiles > 0)
            {
                    for( let index=0; index < numberFiles; index++)
                    {

                        // suppression du fichier image
                        let path = "./" + resGetImagesData[index].path.replace(/\\/g, '/');
                        let imageId = resGetImagesData[index].id;     
                        
                        fs.unlink(path, () => 
                        {
                            // suppression de la ligne dans la table de relation
                            let deleteRelationRow = `delete from site_has_images where image_id=${imageId}`
                            database.dbQuery(deleteRelationRow)
                                    .then()
                                    .catch(() =>  erreur = true)
                            
                            // suppression de la ligne dans la table des images
                            let deleteImageRow = `delete from images where id=${imageId}`;
                            database.dbQuery(deleteImageRow)
                                    .then(()=>
                                        {
                                            if ( index === numberFiles - 1 )
                                                if (erreur)
                                                    response.send("SITE-DB-DELETE-FAIL")
                                                else
                                                    deleteSite(response, siteId);
                                        }
                                    )
                                    .catch(() => 
                                    {
                                        erreur = true;
                                        
                                        if ( index === numberFiles - 1 )
                                            response.send("SITE-DB-DELETE-FAIL");
                                    })
                        });
                    }
            }
            else
            {
                deleteSite(response, siteId);
            }

        })
        .catch(()=>response.send("FAIL-DB-SITE-SELECT"))
})

function deleteSite(response, siteId)
{
    // suppression des lignes spécifiques sites
    let deleteSite = `delete from sites where id=${siteId}`
    database.dbQuery(deleteSite)
            .then( () => response.send("SITE-DB-DELETE-SUCCESS"))
            .catch(() => response.send("SITE-DB-DELETE-FAIL"))
}


module.exports = deleteSiteRouter;