const express = require('express');
const app = express();
const { Client } = require('pg');

const path = require('path');
const bodyParser = require('body-parser');
const { fileURLToPath } = require('url');
const { sha512 } = require('js-sha512');
const fs  = require('fs');

// imports api ws equipements
const telescopeRouter  = require('./Equipment/telescope');
const eyepieceRouter  = require('./Equipment/eyepiece');
const binocularsRouter  = require('./Equipment/binoculars');
const equipmentRouter  = require('./Equipment/equipment-item');
// liste des apis equipements
app.use(telescopeRouter);
app.use(eyepieceRouter);
app.use(binocularsRouter);
app.use(equipmentRouter);




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

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../NightSkyFr/dist/NightSkyFr/')));
app.use('/images', express.static('images'));



// client postgres
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'NIGHTSKYFR',
  password: 'emfadmin',
  port: 5432,
});
client.connect();


// angular frontend
app.get('/*', (req, res) => res.sendFile(path.join(__dirname)));

// lancement du serveur
app.listen(4201, function () {console.log('Example app listening on port 4201!')});





// ************************************************
//
//             SUPPRESSION DES IMAGES EQUIPEMENTS
//
// ************************************************
app.delete('/DeleteAllEquipmentImages', (request, response)=>
{
  // suppression de toutes les images d'un equipement donné
  let itemId = request.query.itemId;
  let itemType = request.query.type;

  // recuperation des id et des chemins des images
  let getImagesData = `select id, path from images where id in (select image_id from ${itemType}_has_images where ${itemType}_id=${itemId})`;
  client.query(getImagesData, (errGetImagesData,resGetImagesData)=>
  {
    if (!errGetImagesData)
    {
      for( let index=0; index < resGetImagesData.rows.length; index++)
      {
              // suppression du fichier image
              let path = "./" + resGetImagesData.rows[index].path.replace(/\\/g, '/');
              let imageId = resGetImagesData.rows[index].id;           
              
              fs.unlink(path, () => 
              {
                  // suppression de la ligne dans la table de relation
                  let deleteRelationRow = `delete from ${itemType}_has_images where image_id=${imageId}`
                  client.query(deleteRelationRow), (errDelRelation, resDelRelation)=>
                  {
                      if(!errDelRelation)
                      {
                        // suppression de la ligne dans la table des images
                        let deleteImageRow = `delete from images where id=${imageId}`;
                        client.query(deleteImageRow,(errDelRow, resDelRow)=>
                        {
                          if(!errDelRow)
                          {
                            res.send("IM-DB-DELETE-ALL-SUCCESS");
                          }
                          else
                          {
                            res.send("IM-DB-DELETE-ROW-FAIL");
                          }
                        });
                      }
                      else
                      {
                        res.send("IM-DB-DELETE-REL-FAIL");
                      }
                  };                  

              });
      }
      response.send("SUCCESS-ALL-IMAGES-DEL");
    }
    else {response.send("FAIL-DB-SELECT");}
  });
});


// ************************************************
//
//        SUPPRESSION D'UNE IMAGE EQUIPEMENT
//
// ************************************************
app.delete('/DeleteEquipmentImage', upload.any('image'),(request, response)=>
{
  
  // suppression d'une image spécifique 
  let imageId = request.query.id;
  let itemType = request.query.type;

  // 1 recuperation chemin image
  let getImagePath = `select path from images where id = ${imageId};`;
  client.query(getImagePath, (errGetImage,resGetImage)=>
  {
    if (!errGetImage)
    {
      // suppression du fichier image
      const path = "./" + resGetImage.rows[0].path.replace(/\\/g, '/');
      
      fs.unlink(path, (errDelFile) => 
      {
          // suppression de la ligne dans la table de relation
          let deleteRelationRow = `delete from ${itemType}_has_images where image_id=${imageId}`
          client.query(deleteRelationRow, (errDelRelation,resDelRelation)=>
          {
            if (!errDelRelation)
            {
              // suppression de la ligne dans la table des images
              let deleteImageRow = `delete from images where id=${imageId}`;
              client.query(deleteImageRow, (errDelImage,resDelImage)=>
              {
                if (!errDelImage)
                {
                  response.send("SUCCESS-IMAGE-DEL");
                  return;
                }
                else{response.send("FAIL-IMAGE-DEL");return;}
              });
            }
            else {response.send("FAIL-IMAGE-RELATION-DEL");return;}
          });          
      });
    }
    else {response.send("FAIL-DB-SELECT");}
  }); 

});


// ************************************************
//
//             INSERTION D'UNE IMAGE EQUIPEMENT
//
// ************************************************
app.post('/addEquipmentImage', upload.any('image'),  (request, response) =>
{
  // récupération des données
  let itemId = request.query.itemId;
  let itemType = request.query.type;
  let itemName = request.query.itemName;
  
  // Insertion des images
  currentFile = request.files[0]; 

  // sauvegarde données image en base
  insertImage = `insert into images values (DEFAULT, '${currentFile.originalname}', '${currentFile.path}' ,  '${itemName}', '', '', CURRENT_TIMESTAMP, 1) RETURNING id;`;
  client.query(insertImage, (errIm, resIm) => 
  {
    if (!errIm)
    {
      // recuperation id image
      let imageIndex = resIm.rows[0].id;              

      // insertion dans la table d'association
      addImageToItem = `insert into ${itemType}_has_images values (${itemId}, ${imageIndex});`
      client.query(addImageToItem, (errRel, resRel)=>
      {
        if(!errRel)
          response.send('DB-INS-IMAGE-SUCCESS');
        else
          response.send('DB-INS-IMAGE-FAIL');     
      }); 
    }
    else
      response.send('DB-INS-IMAGE-FAIL');
  });     
})
