const express = require('express');
const newSiteRouter = express.Router();
const path = require('path');
const { sha512 } = require('js-sha512');
const bodyParser = require('body-parser');
const database = require('./../Database/DatabaseConnection');

newSiteRouter.use(bodyParser.urlencoded({ extended: false }));
newSiteRouter.use(bodyParser.json());

const multer = require('multer');
const storage = multer.diskStorage(
  {
    destination: function (req, file, cb) 
    {
      cb(null, './Images/')
    },
    filename: function (req, file, cb) 
    {
      cb(null, sha512(file.originalname + Date.now()) +  path.extname(file.originalname))
    }
});
const upload=multer({storage:storage});




// ************************************************
//
//             AJOUT D'UN SITE
//
// ************************************************
newSiteRouter.post('/addSite', upload.any('image'),  (req, response) =>
{
  // récupération des données
  // site

  name = req.body.name;
  address = req.body.address;
  postalCode = req.body.postalcode;
  city = req.body.city;
  country = req.body.country;
  latitude = req.body.latitude;
  longitude = req.body.longitude;
  elevation = req.body.elevation;
  description = req.body.description;

  // index des insertions
  SiteIndex = 0;
  imageIndex = 0;

  // gestion des erreurs
  let erreur = false;
  let numberFiles = req.files.length;

  // requete sql
  insertSite = `insert into sites values (DEFAULT, '${name}', '${description}','${longitude}', '${latitude}','${elevation}', '${address}', '${city}',  '${postalCode}', '${country}' ) RETURNING id;`;
  database.dbQuery(insertSite)
          .then((resInsSite) => 
                {
                    // recuperation id Site
                    SiteIndex = resInsSite[0].id;

                        if (numberFiles > 0)
                        {
                            for(let fileIndex = 0; fileIndex < numberFiles; fileIndex++)
                            {
                                let currentFile = req.files[fileIndex];      
                                insertImages = `insert into images values (DEFAULT, '${currentFile.originalname}', '${currentFile.path}' ,  '${name}', '', '', CURRENT_TIMESTAMP, 201) RETURNING id;`;
              
                                // execution de la requete
                                database.dbQuery(insertImages)
                                .then((resInsIm) =>
                                    {
                                        // recuperation id Site
                                        imageIndex = resInsIm[0].id;    

                                        // insertion dans la table d'association
                                        addImageToSite = `insert into site_has_images values (${SiteIndex}, ${imageIndex});`

                                        database.dbQuery(addImageToSite)
                                        .then(()=> 
                                            {                                
                                              if (fileIndex === numberFiles - 1)      
                                              {                                  
                                                if (erreur)
                                                    response.send("DB-NEW-SITE-FAIL");
                                                else
                                                    response.send("DB-NEW-SITE-SUCCESS");
                                              }                                                                
                                            })
                                        .catch( (error) => 
                                            {
                                              erreur = true;

                                              if (fileIndex === numberFiles - 1)
                                                  response.send(error);
                                            })
                                    })
                                .catch((error) => 
                                    {
                                      erreur = true;

                                      if (fileIndex === numberFiles - 1)
                                          response.send(error)
                                    });  
                              }
                      }
                      else
                      {
                          response.send("DB-NEW-SITE-SUCCESS");
                      }


                })
          .catch(error => response.send(error));
  
})


module.exports = newSiteRouter;









    


















     




















