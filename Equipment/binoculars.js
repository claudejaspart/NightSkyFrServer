const express = require('express');
const binocularsRouter = express.Router();
const path = require('path');
const { sha512 } = require('js-sha512');
const database = require('./../Database/DatabaseConnection');

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




// récupère la liste des jumelles
eyepieceRouter.get('/binoculars', (error,response) =>
{
        geteyepieces = 'select * from binoculars;';

        database
            .dbQuery(geteyepieces)
            .then(data => {response.send(data)})
            .catch(error => {response.send(error)})
});

/* Ajout d'une paire de jumelles */
jumelleRouter.post('/addBinoculars', upload.any('image'),  (req, response) =>
{
  // récupération des données
  // Binoculars
  name = req.body.name;
  diameter = req.body.diameter;
  magnification = req.body.magnification;
  afov = req.body.afov
  manufacturer = req.body.manufacturer;
  description = req.body.description;
  author = req.body.author;

  // index des insertions
  BinocularsIndex = 0;
  imageIndex = 0;

  // requete sql
  insertBinoculars = `insert into Binoculars values (DEFAULT, '${name}', '${diameter}', '${magnification}', '${afov}', '${manufacturer}', '${description}', 1 ) RETURNING id;`;
  database
    .dbQuery(insertBinoculars)
    .then(  resInsBinoculars => 
        {
            // recuperation id jumelle
            jumelleIndex = resInsBinoculars[0].id;
            
            // Insertion des images
            req.files.forEach(currentFile => 
            {
                insertImages = `insert into images values (DEFAULT, '${currentFile.originalname}', '${currentFile.path}' ,  '${name}', '', '${author}', CURRENT_TIMESTAMP, 1) RETURNING id;`;
                
                // execution de la requete
                database
                    .dbQuery(insertImages)
                    .then(  resInsIm =>
                    {
                        // recuperation id jumelle
                        imageIndex = resInsIm[0].id;    

                        // insertion dans la table d'association
                        addImageToBinoculars = `insert into binoculars_has_images values (${binocularsIndex}, ${imageIndex});`
                        database
                            .dbQuery(addImageToBinoculars)
                            .then((data)=> 
                            {
                              response.send("DB-NEW-BINOCULARS-SUCCESS")
                            })
                            .catch(error=> response.send(error))
                    })
                    .catch(error => response.send(error))
            });
        })
    .catch(error => response.send(error))

})






module.exports = binocularsRouter