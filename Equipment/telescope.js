const express = require('express');
const telescopeRouter = express.Router();
const database = require('./../Database/DatabaseConnection');
const path = require('path');
const bodyParser = require('body-parser');
const { fileURLToPath } = require('url');
const { sha512 } = require('js-sha512');
const fs  = require('fs');

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

// récupère la liste des telescopes
telescopeRouter.get('/telescopes', (error,response) =>
{
        getTelescopes = 'select * from telescopes;';

        database
            .dbQuery(getTelescopes)
            .then(data => {response.send(data)})
            .catch(error => {response.send(error)})
});


/* Ajout d'un telescope */
telescopeRouter.post('/addTelescope', upload.any('image'),  (req, response) =>
{
  // récupération des données
  // telescope
  name = req.body.name;
  diameter = req.body.diameter;
  focalLength = req.body.focal;
  fdratio = req.body.fdratio;
  manufacturer = req.body.manufacturer;
  description = req.body.description;
  author = req.body.author;

  // index des insertions
  telescopeIndex = 0;
  imageIndex = 0;

  // requete sql
  insertTelescope = `insert into telescopes values (DEFAULT, '${name}', '${diameter}', '${focalLength}', '${fdratio}', '${manufacturer}', '${description}', 1 ) RETURNING id;`;
  database
    .dbQuery(insertTelescope)
    .then(  resInsTel => 
        {
            // recuperation id telescope
            telescopeIndex = resInsTel[0].id;
            
            // Insertion des images
            req.files.forEach(currentFile => 
            {
                insertImages = `insert into images values (DEFAULT, '${currentFile.originalname}', '${currentFile.path}' ,  '${name}', '', '${author}', CURRENT_TIMESTAMP, 1) RETURNING id;`;
                
                // execution de la requete
                database
                    .dbQuery(insertImages)
                    .then(  resInsIm =>
                    {
                        // recuperation id telescope
                        imageIndex = resInsIm[0].id;        

                        // insertion dans la table d'association
                        addImageToTelescope = `insert into telescope_has_images values (${telescopeIndex}, ${imageIndex});`
                        database
                            .dbQuery(addImageToTelescope)
                            .then((data)=> response.send(data))
                            .catch((error)=> response.send(error))
                    })
                    .catch(error => response.send(error))
            });
        })
    .catch(error => response.send(error))

})

module.exports = telescopeRouter

