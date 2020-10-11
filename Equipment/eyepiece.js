const express = require('express');
const eyepieceRouter = express.Router();
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





// récupère la liste des oculaires
eyepieceRouter.get('/eyepieces', (error,response) =>
{
        geteyepieces = 'select * from eyepieces;';

        database
            .dbQuery(geteyepieces)
            .then(data => {response.send(data)})
            .catch(error => {response.send(error)})
});




/* Ajout d'un oculaire */
eyepieceRouter.post('/addEyepiece', upload.any('image'),  (req, response) =>
{
  // récupération des données
  // oculaire
  name = req.body.name;
  focalLength = req.body.focal;
  afov = req.body.afov;
  manufacturer = req.body.manufacturer;
  description = req.body.description;
  author = req.body.author;

  // index des insertions
  eyepieceIndex = 0;
  imageIndex = 0;

  // requete sql
  insertEyepiece = `insert into eyepieces values (DEFAULT, '${name}', '${focalLength}', '${afov}', '${manufacturer}', '${description}', 1 ) RETURNING id;`;
  database
    .dbQuery(insertEyepiece)
    .then(  resInsEyepiece => 
        {
            // recuperation id eyepiece
            eyepieceIndex = resInsEyepiece[0].id;
            
            // Insertion des images
            req.files.forEach(currentFile => 
            {
                insertImages = `insert into images values (DEFAULT, '${currentFile.originalname}', '${currentFile.path}' ,  '${name}', '', '${author}', CURRENT_TIMESTAMP, 1) RETURNING id;`;
                
                // execution de la requete
                database
                    .dbQuery(insertImages)
                    .then(  resInsIm =>
                    {
                        // recuperation id eyepiece
                        imageIndex = resInsIm[0].id;    

                        // insertion dans la table d'association
                        addImageToEyepiece = `insert into eyepiece_has_images values (${eyepieceIndex}, ${imageIndex});`
                        database
                            .dbQuery(addImageToEyepiece)
                            .then((data)=> 
                            {
                              response.send("DB-NEW-EYEPIECE-SUCCESS")
                            })
                            .catch(error=> response.send(error))
                    })
                    .catch(error => response.send(error))
            });
        })
    .catch(error => response.send(error))
})


module.exports = eyepieceRouter