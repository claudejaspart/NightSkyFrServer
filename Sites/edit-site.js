
const express = require('express');
const editSiteRouter = express.Router();
const database = require('./../Database/DatabaseConnection');
const bodyParser = require('body-parser');
const fs  = require('fs');
const path = require('path');
const { sha512 } = require('js-sha512');


editSiteRouter.use(bodyParser.urlencoded({ extended: false }));
editSiteRouter.use(bodyParser.json());


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
//             RECUPERATION DES IMAGES DU SITE
//
// ************************************************

editSiteRouter.get('/SiteImages', (request,response)=>
{
  // récupération type equipement et de son id
  let siteId = request.query.id;
  let absoluteStaticPath = "http:\\\\78.218.242.131:4201\\";


  // récupération de la bonne requete
  let getImagesQuery = `select id, '${absoluteStaticPath}' || path as path, title, description, author from images where id in (select image_id from site_has_images where site_id=${siteId});`;
  // execution de la requete
  database.dbQuery(getImagesQuery)
           .then( (res)=>response.send(res ? res: response.send("NOENTRY-DB-SELECT")))
           .catch( ()=> response.send("FAIL-DB-SELECT") )
});




// ************************************************
//
//             INSERTION D'UNE IMAGE DU SITE
//
// ************************************************
editSiteRouter.post('/AddSiteImage', upload.any('image'),  (request, response) =>
{
  // récupération des données
  let siteId = request.query.SiteId;
  let siteName = request.query.Name;

  // Insertion des images
  currentFile = request.files[0]; 

  // sauvegarde données image en base
  insertImage = `insert into images values (DEFAULT, '${currentFile.originalname}', '${currentFile.path}' ,  '${siteName}', '', '', CURRENT_TIMESTAMP, 1) RETURNING id;`;
  database.dbQuery(insertImage)
          .then((resIm) => 
                  {

                      // recuperation id image
                      let imageIndex = resIm[0].id;     


                      // insertion dans la table d'association
                      addImageToSite = `insert into site_has_images values (${siteId}, ${imageIndex});`
                      database.dbQuery(addImageToSite)
                              .then(()=>response.send('DB-INS-IMAGE-SUCCESS'))
                              .catch(()=> response.send('DB-INS-IMAGE-RELATION-FAIL'))
                    })
          .catch(()=>response.send('DB-INS-IMAGE-FAIL'))
})


// ************************************************
//
//        SUPPRESSION D'UNE IMAGE SITE
//
// ************************************************
editSiteRouter.delete('/DeleteSiteImage', upload.any('image'),(request, response)=>
{
  
  // suppression d'une image spécifique 
  let imageId = request.query.id;

  // 1 recuperation chemin image
  let getImagePath = `select path from images where id = ${imageId};`;
  database.dbQuery(getImagePath)
          .then( (resGetImage) =>
          {
              // suppression du fichier image
              const path = "./" + resGetImage[0].path.replace(/\\/g, '/');

              fs.unlink(path, () => 
                {
                    // suppression de la ligne dans la table de relation
                    let deleteRelationRow = `delete from site_has_images where image_id=${imageId}`

                    database.dbQuery(deleteRelationRow)
                            .then(()=>
                            {
                                // suppression de la ligne dans la table des images
                                let deleteImageRow = `delete from images where id=${imageId}`;
                                database.dbQuery(deleteImageRow)
                                        .then(()=>response.send("SUCCESS-IMAGE-DEL"))
                                        .catch(()=>response.send("FAIL-IMAGE-DEL"))
                            })
                            .catch(()=>response.send("FAIL-IMAGE-RELATION-DEL"))
                });
          })
          .catch(()=>response.send("FAIL-DB-SELECT"))
});



// ************************************************
//
//             SUPPRESSION DES IMAGES SITE
//
// ************************************************
editSiteRouter.delete('/DeleteAllSiteImages', (request, response)=>
{
  // suppression de toutes les images d'un site donné
  let siteId = request.query.siteId;
  let error = false;

  // recuperation des id et des chemins des images
  let getImagesData = `select id, path from images where id in (select image_id from site_has_images where site_id=${siteId})`;
  database.dbQuery(getImagesData)
          .then((resGetImagesData)=>
            {
                for( let index=0; index < resGetImagesData.length; index++)
                {
                        // suppression du fichier image
                        let path = "./" + resGetImagesData[index].path.replace(/\\/g, '/');
                        let imageId = resGetImagesData[index].id;           
                        
                        fs.unlink(path, () => 
                        {
                            // suppression de la ligne dans la table de relation
                            let deleteRelationRow = `delete from site_has_images where image_id=${imageId}`
                            database.dbQuery(deleteRelationRow)
                                  .then(()=>
                                    {
                                        // suppression de la ligne dans la table des images
                                        let deleteImageRow = `delete from images where id=${imageId}`;

                                        database.dbQuery(deleteImageRow)
                                                .then(()=>
                                                  {
                                                    if ((index === resGetImagesData.length - 1))
                                                    {
                                                      if (!error)
                                                        response.send("IM-DB-DELETE-ALL-SUCCESS")
                                                      else
                                                        response.send("IM-DB-DELETE-ALL-FAIL")
                                                    }      
                                                  })
                                                .catch(()=>
                                                {
                                                  error = true;

                                                  if (index === resGetImagesData.length - 1)
                                                    response.send("IM-DB-DELETE-ROW-FAIL");
                                                    
                                                })
                                    })
                                  .catch(()=>error = true)
                        });
                }

            })
          .catch(()=>response.send("FAIL-DB-SELECT"))

});



// ************************************************
//
//             EDITER UN CHAMP D'EQUIPEMENT
//
// ************************************************
editSiteRouter.post('/SaveSiteDataField',  (request, response) =>
{
  // récupération des données
  let siteId = request.body.siteId;
  let fieldName = request.body.fieldName;
  let fieldValue = request.body.fieldValue;


  // variable insertion de single quote
  singleQuote = "";
  if (fieldName !== 'elevation')
    singleQuote = "'";
  
  // mise à jour de la valeur  
  let updateFieldQuery = `update sites set ${fieldName} = ${singleQuote}${fieldValue}${singleQuote} where id = ${siteId};`
  database
    .dbQuery(updateFieldQuery)
    .then(() => {response.send("SITE-DB-UPDATE-SUCCESS")})
    .catch(() => {response.send("SITE-DB-UPDATE-FAIL")})

});


module.exports = editSiteRouter;