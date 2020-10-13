const express = require('express');
const equipmentRouter = express.Router();
const path = require('path');
const { sha512 } = require('js-sha512');
const database = require('./../Database/DatabaseConnection');
const bodyParser = require('body-parser');
const fs  = require('fs');

equipmentRouter.use(bodyParser.urlencoded({ extended: false }));
equipmentRouter.use(bodyParser.json());

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
//             EDITER UN CHAMP D'EQUIPEMENT
//
// ************************************************
equipmentRouter.post('/SaveEquipmentDataField',  (request, response) =>
{
  // récupération des données
  let itemType = request.body.itemType;
  let itemId = request.body.itemId;
  let fieldName = request.body.fieldName;
  let fieldValue = request.body.fieldValue;

  
  // correction du nom du type
  itemType = itemType + (itemType !== 'binoculars' ? 's' : '');

  // variable insertion de single quote
  singleQuote = "";
  if (fieldName === 'description' || fieldName === 'name' || fieldName === 'manufacturer')
    singleQuote = "'";
  
  // mise à jour de la valeur  
  let updateFieldQuery = `update ${itemType} set ${fieldName} = ${singleQuote}${fieldValue}${singleQuote} where id = ${itemId};`
  database
    .dbQuery(updateFieldQuery)
    .then(data => {response.send("EQUIPMENT-DB-UPDATE-SUCCESS")})
    .catch(error => {response.send("EQUIPMENT-DB-UPDATE-FAIL")})

});


// ************************************************
//
//             SUPPRIME UN EQUIPEMENT
//
// ************************************************
equipmentRouter.delete('/deleteItem', (request,response)=>
{
  // récupération des parametres
  let itemId = request.query.itemId;
  let itemType = request.query.itemType;

  // suppression des images (fichiers physiques, lignes et relations)
  // recuperation des id et des chemins des images
  let getImagesData = `select id, path from images where id in (select image_id from ${itemType}_has_images where ${itemType}_id=${itemId})`;
  
  database.dbQuery(getImagesData)
        .then( (resGetImagesData ) =>
        {

            for( let index=0; index < resGetImagesData.length; index++)
            {

                // suppression du fichier image
                let path = "./" + resGetImagesData[index].path.replace(/\\/g, '/');
                let imageId = resGetImagesData[index].id;     
                
                fs.unlink(path, () => 
                {
                    // suppression de la ligne dans la table de relation
                    let deleteRelationRow = `delete from ${itemType}_has_images where image_id=${imageId}`
                    database.dbQuery(deleteRelationRow)
                            .then()
                            .catch(() => response.send("ITEM-DB-DELETE-IMAGE-RELATION-FAIL"))
                    
                    // suppression de la ligne dans la table des images
                    let deleteImageRow = `delete from images where id=${imageId}`;
                    database.dbQuery(deleteImageRow)
                            .then()
                            .catch(() => response.send("ITEM-DB-DELETE-IMAGE-FAIL"))
                });
            }

            // suppression des lignes spécifiques équipements
            let itemTypeName = itemType + (itemType !== 'binoculars' ? 's' : '');
            let deleteItem = `delete from ${itemTypeName} where id=${itemId}`
            database.dbQuery(deleteItem)
                    .then( () => response.send("ITEM-DB-DELETE-SUCCESS"))
                    .catch( () => response.send("ITEM-DB-DELETE-FAIL"))

        })
        .catch(()=>response.send("FAIL-DB-SELECT"))
})


// ************************************************
//
//             RECUPERATION DES IMAGES EQUIPEMENTS
//
// ************************************************

equipmentRouter.get('/EquipmentImages', (request,response)=>
{
  // récupération type equipement et de son id
  let itemId = request.query.id;
  let itemType = request.query.type;
  let absoluteStaticPath = "http:\\\\78.218.242.131:4201\\";
  
  // récupération de la bonne requete
  let getImagesQuery = `select id, '${absoluteStaticPath}' || path as path, title, description, author from images where id in (select image_id from ${itemType}_has_images where ${itemType}_id=${itemId});`;
  // execution de la requete
  database.dbQuery(getImagesQuery)
           .then( (res)=>response.send(res ? res: response.send("NOENTRY-DB-SELECT")))
           .catch( ()=> response.send("FAIL-DB-SELECT") )
});


// ************************************************
//
//             INSERTION D'UNE IMAGE EQUIPEMENT
//
// ************************************************
equipmentRouter.post('/addEquipmentImage', upload.any('image'),  (request, response) =>
{
  // récupération des données
  let itemId = request.query.itemId;
  let itemType = request.query.type;
  let itemName = request.query.itemName;
  
  // Insertion des images
  currentFile = request.files[0]; 

  // sauvegarde données image en base
  insertImage = `insert into images values (DEFAULT, '${currentFile.originalname}', '${currentFile.path}' ,  '${itemName}', '', '', CURRENT_TIMESTAMP, 1) RETURNING id;`;
  database.dbQuery(insertImage)
          .then((resIm) => 
                  {

                      // recuperation id image
                      let imageIndex = resIm[0].id;              

                      // insertion dans la table d'association
                      addImageToItem = `insert into ${itemType}_has_images values (${itemId}, ${imageIndex});`
                      database.dbQuery(addImageToItem)
                              .then(()=>response.send('DB-INS-IMAGE-SUCCESS'))
                              .catch(()=> response.send('DB-INS-IMAGE-FAIL'))
                    })
          .catch(()=>response.send('DB-INS-IMAGE-FAIL'))
})



// ************************************************
//
//        SUPPRESSION D'UNE IMAGE EQUIPEMENT
//
// ************************************************
equipmentRouter.delete('/DeleteEquipmentImage', upload.any('image'),(request, response)=>
{
  
  // suppression d'une image spécifique 
  let imageId = request.query.id;
  let itemType = request.query.type;

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
                    let deleteRelationRow = `delete from ${itemType}_has_images where image_id=${imageId}`

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
//             SUPPRESSION DES IMAGES EQUIPEMENTS
//
// ************************************************
equipmentRouter.delete('/DeleteAllEquipmentImages', (request, response)=>
{
  // suppression de toutes les images d'un equipement donné
  let itemId = request.query.itemId;
  let itemType = request.query.type;
  let error = false;

  // recuperation des id et des chemins des images
  let getImagesData = `select id, path from images where id in (select image_id from ${itemType}_has_images where ${itemType}_id=${itemId})`;
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
                            let deleteRelationRow = `delete from ${itemType}_has_images where image_id=${imageId}`
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


module.exports = equipmentRouter

